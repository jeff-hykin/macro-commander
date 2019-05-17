const { window } = require("vscode")
const vscode = require("vscode")

let activeContext
let disposables = []
let macros = {}
let invalidMacroNames = [ "has", "get", "update", "inspect" ]
exports.activate = function activate(context) {
    loadMacros(context)
    activeContext = context
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

async function executeMacro(name) {
    // iterate over every action in the macro
    for (const action of macros[name]) {
        // if its a string assume its a command
        if (typeof action == "string") {
            await vscode.commands.executeCommand(action)
            // otherwise check if its an object
        } else if (action instanceof Object) {
            //
            // Check if its a javascript macro
            //
            if (typeof action.javascript == "string") {
                eval(action.javascript)
                continue
            }
            //
            // Check for injections
            //
            let replacements = []
            let actionCopy = JSON.parse(JSON.stringify(action))
            if (action.injections) {
                for (let eachInjection of action.injections) {
                    //
                    // Compute the value the user provided
                    //
                    let value = eval(eachInjection.withResultOf)
                    if (value instanceof Promise) {
                        value = await value
                    }
                    value = `${value}`
                    //
                    // replace it in the arguments
                    //
                    for (let eachKey in actionCopy.args) {
                        // if its a string value, then perform a replacement
                        // TODO, this is currently shallow, it should probably be recursive
                        if (typeof actionCopy.args[eachKey] == "string") {
                            actionCopy.args[eachKey] = actionCopy.args[eachKey].replace(eachInjection.replace, value)
                        }
                    }
                }
            }
            //
            // run the command
            //
            await vscode.commands.executeCommand(actionCopy.command, actionCopy.args)
        }
    }
}

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
        const disposable = vscode.commands.registerCommand(`macros.command.${name}`, ()=>executeMacro(name))
        context.subscriptions.push(disposable)
        disposables.push(disposable)
    }
}

// create a command for running macros by name
vscode.commands.registerCommand('macro.run', async () => {
    let macroNames = Object.keys(macros).filter(each=>macros[each] instanceof Array)
    let result = await window.showQuickPick(macroNames)
    executeMacro(result)
})
