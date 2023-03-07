## What does this do?
It lets you write a quick sequence of commands/scripts to automate VS Code tasks.
Example sub-actions are; running command line commands, opening a debugging session, pushing git changes, renaming many files, creating smart snippets, formatting the current file and more.

## What are some use-case examples?
- A run command that opens up a terminal, starts an SSH connection, and then runs commands on the SSH server
- A new-project command that goes to where ever you typically save projects, uses the GUI to ask for the name of the project, creates the folder, creates a .gitignore with your preferences, runs an init command, and then opens the folder in your current VS Code window.
- A command that opens a project folder, pulls the latest changes, opens several files in that folder, and then displays the recent changes in those files.
- A folder-specific start command, that pulls the latest changes, installs dependiences, formats files, and then opens the debugger with a specific file.

## How do I use it?
1. Find the name of commands you want to run. You can do this by going to the VS Code keybindings.json
(go to gear-icon -> keybindings, then press the {}'s in the top right corner)
All of the `"command":`'s (ex: `"command": "workbench.action.terminal.new"`) can be copied and pasted into the macro
2. Open up your VS Code settings.json and create a new section like this:
(go to gear-icon -> settings, then press the {}'s in the top right corner)
```json
"macros": {
    "exampleMacro1": [
        // a simple command to open a new terminal
        // (See lots more examples below)
        "workbench.action.terminal.new",
    ]
}
```
3. To run the macro open the command pallet (cmd+shift+P or ctrl+shift+P) and type `run macro` then pick which one you want to run.
4. Create a keybinding to the macro (*its different from normal keybindings)
Open up your VS Code keybindings.json, add the name of the macro you just made to a keybinding<br>
NOTE: VS Code will tell you the command is invalid, **ignore that and save it anyways**
(see https://github.com/jeff-hykin/macro-commander/issues/1#issuecomment-505951698 as to why)
```json
{
  "key": "ctrl+cmd+/",
  "command": "macros.exampleMacro1"
}
```
Now whenever those keys are pressed, the macro commands will execute

## What are some macro examples?
See also [Level up your Coding with Macros](http://gedd.ski/post/level-up-coding-with-macros/) 
```jsonc
"macros": {
    "terminalExample1": [
        // a simple command to open a new terminal
        "workbench.action.terminal.new",
        // a command with arguments, that sends text to the terminal
        {
            "command": "workbench.action.terminal.sendSequence", 
            // the "text" arg was decided by VS Code (not me)
            "args": { "text": "echo hello\n" }
        },
    ],
    "terminalExample2" : [
        // a simple command to open a new terminal
        "workbench.action.terminal.new",
        // combine javascript and commands
        {
            "injections" : [
                { "replace": "$currentFile", "withResultOf": "window.activeTextEditor.document.uri.fsPath" },
                { "replace": "$currentFolder", "withResultOf": "vscode.workspace.rootPath" },
            ],
            "command": "workbench.action.terminal.sendSequence",
            "args": { "text": "echo the current file is: $currentFile\necho the current folder is: $currentFolder\n" }
        },
    ],
    "userInputExample1" : [
        // javascript execution (see https://code.visualstudio.com/api/extension-capabilities/common-capabilities)
        {
            // this has access to the `vscode` object, the `window` object and the `path` object (from node path)
            // the javascript is also run inside of an async function, meaning you can use the `await` keyword
            "javascript": "window.showInformationMessage(`You entered: ${await window.showInputBox()}`)"
        },
    ],
    "userInputExample2" : [
        {
            "javascript": [
                "let response = await window.showInputBox()",
                "await window.showInformationMessage(`You entered: ${response}`)",
            ]
        },
    ],
    "javascriptPlusTerminalExample" : [
        // run a hidden console command (runs in the background)
        {
            // NOTE: don't start a command in a hiddenConsole
            //       that doesn't finish! there's no good way 
            //       of killing/canceling it
            // 
            // this echo will never be seen
            "hiddenConsole": [
                "touch .gitignore",
                "echo hello"
            ]
        },
        // combine javascript and hidden console commands
        {
            "injections" : [
                { "replace": "$currentFolder", "withResultOf": "vscode.workspace.rootPath" },
            ],
            "hiddenConsole": [
               "cd \"$currentFolder\"", 
               "touch .gitignore"
            ]
        },
    ],
    "terminalWithBashFunctions" : [
        {
            "injections" : [
                { "replace": "$currentFolder", "withResultOf": "vscode.workspace.rootPath" }
            ],
            // I wanted to use aliases defined in my bash profile
            // here's a hacky way of doing that
            "hiddenConsole": [
                "bash <<HEREDOC",
                "    source ~/.bash_profile",
                "    cd \"$currentFolder\"",
                "    echo now I can use aliases",
                "HEREDOC",
            ]
        }
    ],
    "exampleOfCommonInjections" : [
        {
            "injections" : [
                { "replace": "$userInput",       "withResultOf": "await window.showInputBox()" },
                { "replace": "$currentFolder",   "withResultOf": "vscode.workspace.rootPath" },
                { "replace": "$currentFile",     "withResultOf": "window.activeTextEditor.document.uri.fsPath" },
                { "replace": "$currentFileName", "withResultOf": "path.basename(window.activeTextEditor.document.uri.fsPath)" },
                { "replace": "$currentFileNameNoExtension", "withResultOf": "path.basename(window.activeTextEditor.document.uri.fsPath).replace(/\\.[^/.]+$/, '')" },
                { "replace": "$currentFileDir", "withResultOf": "path.dirname(window.activeTextEditor.document.uri.fsPath)" },
            ],
            "hiddenConsole" : "echo $userInput"
        }
    ],
    "WriteToOutputExample": [
        {
            "javascript": [
                //create a new OUTPUT log, with name "MyLog"
                "const myOutput = window.createOutputChannel('MyLog'); ",   
    
                //write a message to OUTPUT log                              
                "await myOutput.appendLine('Lorem ipsum dolor sit amet, consectetur adipisci elit.'); ",  

                //show the OUTPUT log       
                "await myOutput.show(); ",                                                                   
            ],
        },
    ],
    "replaceAllExample1": [
        {
            "javascript": [
                //save the current clipboard
                "var oldClip = await vscode.env.clipboard.readText(); ",    

                //copies the selected text to the clipboard
                "await vscode.commands.executeCommand('editor.action.clipboardCopyAction'); ",
                "var testoSelezionato = await vscode.env.clipboard.readText(); ",   

                //replace all "gatta" to "##########"
                "var nuovoTesto = testoSelezionato.replace(/gatta/g, '##########'); ",   

                //paste the new text
                "if( nuovoTesto != testoSelezionato ) { ",          
                "   await vscode.env.clipboard.writeText(nuovoTesto); ", 
                "   await vscode.commands.executeCommand('editor.action.clipboardPasteAction'); ",
                "} ",          

                //restore the original clipboard
                "await vscode.env.clipboard.writeText(oldClip); ", 
            ],
        },
    ],
    "replaceAllExample2": [
        { 
            "javascript": [
                // parameters
                "var cerca       = 'gatta'; ",
                "var opzioni     = 'g'; ",             // g = global; i = ignorecase     
                "var sostituisci = '##########'; ",
                // get the currently active editor
                "const myEditor = vscode.window.activeTextEditor; ",
                "if (myEditor) {",
                    // perform an edit on the document associated with this text editor
                    "myEditor.edit(myEditBuilder => { ",

                        // loop for each multi-cursor
                        "myEditor.selections.forEach(rangeSelezione => {",
                            // get selected text from a single multi-cursor
                            "var testoSelezionato = myEditor.document.getText(rangeSelezione);",
                            // replace all 
                            "var nuovoTesto = testoSelezionato.replace(new RegExp(cerca, opzioni), sostituisci);",
                            // if the text has changed, I write it in the document
                            "if(nuovoTesto != testoSelezionato) { ",
                                "myEditBuilder.replace(rangeSelezione, nuovoTesto);",
                            "}",
                        "});",
                    "});",
                "}",
            ]
        }
    ],    
}
```

## Who made this?
The old extension was made by [geddski](http://gedd.ski)
<br>I modified it to have
- in-order execution
- javascript / javascript-injections
- async await
- keybindings + named execution 
- error message pop-ups
- auto reload when settings was edited
- and a few other things
