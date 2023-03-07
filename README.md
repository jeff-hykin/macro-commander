## What does this do?
It lets you write a quick sequence of commands/scripts to automate VS Code tasks.
Example sub-actions are: running command line commands, opening a debugging session, pushing git changes, renaming many files, creating smart snippets, formatting the current file and more.

## What are some use-case examples?
- A run command that opens up a terminal, starts an SSH connection, and then runs commands on the SSH server
- A new-project command that goes to where ever you typically save projects, uses the GUI to ask for the name of the project, creates the folder, creates a .gitignore with your preferences, runs an init command, and then opens the folder in your current VS Code window.
- A command that opens a project folder, pulls the latest changes, opens several files in that folder, and then displays the recent changes in those files.
- A folder-specific start command, that pulls the latest changes, installs dependences, formats files, and then opens the debugger with a specific file.

## How do I use it?
1. Find the name of commands you want to run. You can do this by going to the VS Code keybindings.json
(go to gear-icon -> keybindings, then press the ↪📄 in the top right corner)
All of the `"command":`'s (ex: `"command": "workbench.action.terminal.new"`) can be copied and pasted into the macro
2. Open up your VS Code settings.json and create a new section like this:
(go to gear-icon -> settings, then press the {}'s in the top right corner)
```jsonc
"macros": {
    "exampleMacro1": [
        // a simple command to open a new terminal
        "workbench.action.terminal.new",
    ]
}
```
3. To run the macro open the command pallet (cmd+shift+P or ctrl+shift+P) and type `run macro` then pick which one you want to run.
4. To create a keybinding to the macro, simply open the Keyboard Shortcuts (Gear-icon -> Keyboard Shortcuts) and start to type "macros". All of the macros have a "macros." prefix.


## What is allowed in the array? (Tons of Examples Below)

A element in the array has the following options:

- provide a quoted string: which calls a command that requires no arguments.
- call a command with args using `{"command": "COMMAND_HERE", args:/*stuff*/}` 
- call a command with javascript injections using `{ "injections": [], "command": "COMMAND_HERE", args:/*stuff*/}` 
- run javascript directly using `{ "javascript": [] }` 
- call a hidden console using `{ "injections": [], "hiddenConsole": [] }` 

NOTE:
1. The javascript runs inside of an async function, meaning you can use the `await` keyword
2. Javascript has access to:
  - the `vscode` object: (`vscode.commands`, `vscode.env`, `vscode.workspace`, `vscode.tasks`, etc.) is documented here: https://code.visualstudio.com/api/
  - the `window` object, a shortcut to `vscode.window`.
  - the `path` object (from node path)

3. The `"withResultOf"` argument can be a single value (`3.14159 || null`) or multiple statements (`await window.showInputBox(); console.log("hi")`).


## What are some examples?
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
    "unMultiSelectLast": [
        // For when you Ctrl-Click to multiselect 10 times and on the eleventh get it wrong. 
        // Just press Ctrl-0 (or whatever key you assign) to unselect the eleventh, then carry on.
        // (See also, https://github.com/danseethaler/vscode-tab-through-selections, for more along this line.)
        {
            "javascript": [
                "const editor = window.activeTextEditor;",
                "const newSelections = editor.selections.slice(0, editor.selections.length - 1);",
                "editor.selections = newSelections;"
            ]
        }
    ],
    "transformToSnake": [
        // A multi-select friendly macro to convert from CamelCase to snake_case.
        // If any particular selection is empty (just a cursor), this will automatically expand it to the whole word first.
        // (Kudos to https://stackoverflow.com/users/398630/brainslugs83 for some pointers)
        {
            "javascript": [
                "let editor = window.activeTextEditor;",
                "expandWords();",
                "doTransform(0);",
                "function expandWords() { let sels = editor.selections; let i = sels.length-1;",
                "  while (i >=0) { let sel = sels[i];",
                "    if (sel.isEmpty) {r = editor.document.getWordRangeAtPosition(sel.start); sels[i] = new vscode.Selection(r.start, r.end);}",
                "    i--; }",
                "  editor.selections = sels;",
                "}",
                "function doTransform(i) { let sels = editor.selections;",
                "  if (i < 0 || i >= sels.length) { return; }",
                "  let sel = sels[i];",
                "  let word_matches = editor.document.getText(sel).matchAll(/([a-z]+|[A-Z][a-z]*|[^A-Za-z]+)/g);",
                "  let words = [];",
                "  for (const match of word_matches) {words.push(match[0].toLowerCase())};",
                "  editor.edit(eb => {eb.replace(sel, words.join('_'))}).then(x => { doTransform(i+1); });",
                "}"
            ]
        }
    ],
    "transformToCamel": [
        // Same as transformToSnake, but vice versa
        {
            "javascript": [
                "let editor = window.activeTextEditor;",
                "expandWords();",
                "doTransform(0);",
                "function expandWords() { let sels = editor.selections; let i = sels.length-1;",
                "  while (i >=0) { let sel = sels[i];",
                "    if (sel.isEmpty) {r = editor.document.getWordRangeAtPosition(sel.start); sels[i] = new vscode.Selection(r.start, r.end);}",
                "    i--; }",
                "  editor.selections = sels;",
                "}",
                "function doTransform(i) { let sels = editor.selections;",
                "  if (i < 0 || i >= sels.length) { return; }",
                "  let sel = sels[i];",
                "  let words = editor.document.getText(sel).split('_')",
                "  let camel_words = words.map(function(w) {return w[0].toUpperCase() + w.slice(1,).toLowerCase()});",
                "  editor.edit(eb => {eb.replace(sel, camel_words.join(''))}).then(x => { doTransform(i+1); });",
                "}"
            ]
        }
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

## Some Common Macro Steps
| Desired Action             | Macro Step (example)
| -------------------------- | ------------------------------------------------------------------------------------------------
| execute a snippet          | {"command": "type", "args": {"text": "mySnippetPrefixHere"}}, "insertSnippet" ]
| open a new terminal        | "workbench.action.terminal.new"
| type into the terminal     | { "command": "workbench.action.terminal.sendSequence", "args": { "text": "echo hello\n" } }
| message box                | { "javascript": "window.showInformationMessage(`You entered: ${await window.showInputBox()}`)" }
| user input                 | { "javascript": [ "let response = await window.showInputBox()" ], ...
| user output                | ... [ "await window.showInformationMessage(`You entered: ${response}`)" ] }
| Copy to clipboard          | "editor.action.clipboardCopyAction"


## Some Common Injections:
| Desired Value                 | JavaScript Expression
| ----------------------------- | ------------------------------------------------------------------------------------------------
| $userInput                    | await window.showInputBox()
| $currentFolder                | vscode.workspace.rootPath
| $currentFile                  | window.activeTextEditor.document.uri.fsPath
| $currentFileName              | path.basename(window.activeTextEditor.document.uri.fsPath)
| $currentFileNameNoExtension   | path.basename(window.activeTextEditor.document.uri.fsPath).replace(/\\.[^/.]+$/, '')
| $currentFileDir               | path.dirname(window.activeTextEditor.document.uri.fsPath)
| $selectionText                | window.activeTextEditor.document.getText(window.activeTextEditor.selection)
| $clipboardText                | vscode.env.clipboard.readText()
| $preferedLanguage             | vscode.env.language ("en-US")
| $machineId                    | vscode.env.machineId (The name of computer you are running on)
| $sessionId                    | vscode.env.sessionId (A unique string that changes when VS Code restarts)
| $shellName                    | vscode.env.shell (The name of the default terminal shell)


## Some Useful JavaScript (assuming: const doc = window.activeTextEditor.document)
| Category      | Desired Action                     | JavaScript Code
| ------------- | ---------------------------------- | --------------------------------------------------------------
| Document text | The entire text                    | doc.getText()
| Document text | Part of the text                   | doc.getText(range)
| Document text | Range of the word at cursor        | doc.getWordRangeAtPosition(position)
| Document text | The line of text at cursor         | doc.lineAt(line: number)
| Document text | The line of text at a position     | doc.lineAt(position)   // a Position is a line number/char number pair
| Document text | Convert position to overall offset | doc.offsetAt(position)
| Document text | Convert overall offset to position | doc.positionAt(offset: number)
| Document info | EOL style                          | doc.eol                // enum (LF=1, CRLF=2)
| Document info | File name                          | (doc.isUntitled ? "" : doc.fileName)
| Document info | Needs saving                       | doc.isDirty
| Document info | Line count                         | doc.lineCount
| Document info | Save to disk                       | doc.save()
| Multi-Select  | If multi-selected...               | if (window.activeTextEditor.selections.length > 1) { ... };
| Multi-Select  | Only act if index is in range      | if (window.activeTextEditor.selections[index]) { ... };
| Multi-Select  | Scroll to a particular selection   | window.activeTextEditor.revealRange(window.activeTextEditor.selections[index]);
| Multi-Select  | Select only the last selection     | window.activeTextEditor.selection = window.activeTextEditor.selections.pop();


## Who made this?
<br>[polyglot-jones](https://github.com/polyglot-jones) improved the documentation and added three big examples (unMultiSelectLast, transformToSnake, transformToCamel)
<br>The old extension was made by [geddski](http://gedd.ski)
<br>I modified it to have
- in-order execution
- javascript / javascript-injections
- async await
- keybindings + named execution 
- error message pop-ups
- auto reload when settings was edited
- and a few other things
