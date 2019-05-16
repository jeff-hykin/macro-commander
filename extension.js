const { window } = require("vscode")
const vscode = require("vscode")

var activeContext
var disposables = []

exports.activate = function activate(context) {
    loadMacros(context)
    activeContext = context
    vscode.workspace.onDidChangeConfiguration(() => {
        // dispose of macros
        for (var disposable of disposables) {
            disposable.dispose()
        }
        // reload them
        loadMacros(activeContext)
    })
}

exports.deactivate = function deactivate() {}

function loadMacros(context) {
    // get the macros from the settings file
    const macros = vscode.workspace.getConfiguration("macros")

    // look at each macro
    for (const name in macros) {
        // skip the built-in ones
        if (name == "has" || name == "get" || name == "update") {
            continue
        }
        // register each one as a command
        const disposable = vscode.commands.registerCommand(`macros.${name}`, async function() {
            // iterate over each action
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
        })
        context.subscriptions.push(disposable)
        disposables.push(disposable)
    }
}
