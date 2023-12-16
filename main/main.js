const { window } = require("vscode")
const vscode = require("vscode")
const { execSync } = require("child_process")
const path = require("path")
const fs = require("fs")

// 
// globals
// 
let activeContext
let disposables = []
let macros = {}
let invalidMacroNames = ["has", "get", "update", "inspect"]


// 
// register commands
// 

// create a command for running macros by name
vscode.commands.registerCommand("macro.run", async () => {
    let macroNames = Object.keys(macros).filter(each => macros[each] instanceof Array)
    let result = await window.showQuickPick(macroNames)
    executeMacro(result)
})

// command that helps with creating new macros 
vscode.commands.registerCommand("macro.list-builtin-commands", async () => {
    let commands = await vscode.commands.getCommands()
    let result = await window.showQuickPick(commands)
    if (result != null) {
        await vscode.commands.executeCommand(result)
    }
})

// create a dummy command that works out of the box
vscode.commands.registerCommand("macro.this.is.a.real.dummy.command", async () => {
    window.showInformationMessage(`Congratulations you ran the dummy command`)
})


// 
// helpers
//

// see https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") // $& means the whole matched string
}

function flushEventStack() {
    // this is a sleep timer for 0 seconds, which sounds dumb
    // the reason it's useful is because it puts a function on the BOTTOM of the javascript event stack
    // and then we wait for it to occur
    // this means runs all of the already-scheduled things to occur
    // which is ideal because it makes pop ups and other events happen in a more sequential/timely order
    return new Promise(r => setTimeout(r, 0))
}

function cleanUpErrorStack(errorStack) {
    console.debug(`errorStack is:`,errorStack)
    return errorStack.replace(
        /at executeMacro \(.+\/macro-commander\/extension\.js:\d+:\d+\)/g,
        "",
    ).replace(
        /at \S+\/macro-commander\/extension\.js:\d+:\d+/g,
        "",
    ).replace(
        /at process\.processTicksAndRejections \(node:internal\/process\/task_queues:\d+:\d+\)/,
        "",
    ).replace(
        /at async n._executeContributedCommand \(.+\/extensionHostProcess.js:\d+:\d+\)/, 
        "",
    )
}

// 
// on first load
// 
exports.activate = function activate(context) {
    loadMacros(context)
    activeContext = context
    // whenever settings is changed
    vscode.workspace.onDidChangeConfiguration(() => {
        // dispose of macros
        for (let disposable of disposables) {
            disposable.dispose()
        }
        // reload them
        loadMacros(activeContext)
    })
}

exports.deactivate = function deactivate() {}

// 
// create macros from settings
// 
function loadMacros(context) {
    // get the macros from the settings file
    macros = vscode.workspace.getConfiguration("macros")

    // look at each macro
    for (const name in macros) {
        // skip the things that are not arrays
        if (!(macros[name] instanceof Array)) {
            continue
        }
        // register each one as a command
        const disposable = vscode.commands.registerCommand(`macros.${name}`, () => executeMacro(name))
        context.subscriptions.push(disposable)
        disposables.push(disposable)
    }
}


async function executeMacro(name) {
    let commandIndex = -1
    // iterate over every action in the macro
    for (const action of macros[name]) {
        commandIndex += 1
        console.log(`action is:`, action)
        // if its a string assume its a command
        if (typeof action == "string") {
            await vscode.commands.executeCommand(action)
            await flushEventStack()
            // otherwise check if its an object
        } else if (action instanceof Object) {
            //
            // Check if its a javascript macro
            //
            const isJavascriptAction = Object.keys(action).includes("javascript")
            if (isJavascriptAction) {
                let javascriptAction = ""
                if (typeof action.javascript == "string") {
                    javascriptAction = action.javascript
                    if (action.javascript.endsWith(".js")) {
                        try {
                            javascriptAction = fs.readFileSync(action.javascript, 'utf8');
                            // Allowing users to have single import for intellisense
                            javascriptAction = javascriptAction.replace("import * as vscode from 'vscode';", "")
                        } catch (err) {
                            window.showWarningMessage(
                                `For the "${name}" macro\nThere's a "javascript" part (section #${commandIndex+1}), but when I ran it, I got an error: ${cleanUpErrorStack(error.stack)}`
                            )
                            return
                        }
                       
                    }
                // if its an array, convert the array to a string
                } else if (action.javascript instanceof Array) {
                    javascriptAction = action.javascript.join("\n")
                } else {
                    window.showWarningMessage(
                        `For the ${name} macro\nThere's a "javascript" section thats not a string or an array but instead: ${JSON.stringify(action.javascript)}`
                    )
                    // shutdown the whole operation
                    return
                }

                try {
                    await eval(`(async()=>{${javascriptAction}})()`)
                    await flushEventStack()
                } catch (error) {
                    window.showWarningMessage(
                        `For the "${name}" macro\nThere's a "javascript" part (section #${commandIndex+1}), but when I ran it, I got an error: ${cleanUpErrorStack(error.stack)}`
                    )
                    return
                }
                continue
            }
            //
            // Check for injections
            //
            let replacements = []
            let actionCopy = JSON.parse(JSON.stringify(action))
            if (action.injections) {
                for (let eachInjection of action.injections) {
                    if (eachInjection.withResultOf instanceof Array) {
                        eachInjection.withResultOf = eachInjection.withResultOf.join("\n")
                    }
                    //
                    // Compute the value the user provided
                    //
                    let value
                    try {
                        value = eval(eachInjection.withResultOf)
                    } catch (error) {
                        try {
                            value = await eval(`(async ()=>${eachInjection.withResultOf})()`)
                        } catch (error) {
                            // if it has multiple statements or a return keyword
                            if (eachInjection.withResultOf.match(/\breturn\b|\n|;/)) {
                                try {
                                    value = await eval(`(async ()=>{${eachInjection.withResultOf};})()`)
                                } catch (error) {
                                    window.showWarningMessage(
                                        `For the "${name}" macro\nin the "${eachInjection.replace}" replacement (section #${commandIndex+1}),\nThere was an error when running it: ${cleanUpErrorStack(error.stack)}`
                                    )
                                    return
                                }
                            } else {
                                window.showWarningMessage(
                                    `For the "${name}" macro\nin the "${eachInjection.replace}" replacement (section #${commandIndex+1}),\nThere was an error when running it: ${cleanUpErrorStack(error.stack)}`
                                )
                                return
                            }
                        }
                    }
                    if (value instanceof Promise) {
                        value = await value
                    }
                    value = `${value}`
                    //
                    // replace it in the arguments
                    //
                    let replacer = name => {
                        if (typeof name == "string") {
                            return name.replace(RegExp(escapeRegExp(eachInjection.replace), "g"), value)
                        }
                        return name
                    }
                    for (let eachKey in actionCopy.args) {
                        // if its a string value, then perform a replacement
                        // TODO, this is currently shallow, it should probably be recursive
                        if (typeof actionCopy.args[eachKey] == "string") {
                            actionCopy.args[eachKey] = replacer(actionCopy.args[eachKey])
                        }
                    }
                    
                    // convert arrays to strings 
                    let hiddenConsole = actionCopy.hiddenConsole
                    if (hiddenConsole instanceof Array) {
                        hiddenConsole = hiddenConsole.join("\n")
                    }
                    if (typeof hiddenConsole == 'string') {
                        hiddenConsole += "\n"
                    }

                    
                    // replace it in the console command
                    actionCopy.hiddenConsole = replacer(hiddenConsole)
                }
            }
            //
            // run the command
            //
            actionCopy.hiddenConsole && execSync(actionCopy.hiddenConsole)
            actionCopy.command && (await vscode.commands.executeCommand(actionCopy.command, actionCopy.args))
        }
    }
}
