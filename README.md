## What does this do?
It lets you write a quick sequence of commands/scripts to automate VS Code tasks.
Example sub-actions are: running command line commands, opening a debugging session, pushing git changes, renaming many files, creating smart snippets, formatting the current file and more.

## What are some use-case examples?
- A run command that opens up a terminal, starts an SSH connection, and then runs commands on the SSH server
- A new-project command that goes to where ever you typically save projects, uses the GUI to ask for the name of the project, creates the folder, creates a .gitignore with your preferences, runs an init command, and then opens the folder in your current VS Code window.
- A command that opens a project folder, pulls the latest changes, opens several files in that folder, and then displays the recent changes in those files.
- A folder-specific start command, that pulls the latest changes, installs dependences, formats files, and then opens the debugger with a specific file.

## How do I use it?
1. Find the names of commands you want to run.
You can do this by opening the VS Code keybindings.json file -- 
Gear-icon -> Keyboard Shortcuts -> press the open-settings icon in the top right corner. 
(It used to look like {}, but now it looks like a dog-eared page with a wrap-around arrow.) 
All of the `"command":`'s can be copied and pasted into the macro.
2. Open your VS Code settings.json and create a new `macros` section -- 
Gear-icon -> Settings -> open-settings icons in the top right corner.

```json
"macros": {
    "exampleMacro1": [
        "macro.this.is.a.real.dummy.command"
    ]
}
```
3. To run the macro open the command pallet (cmd+shift+P or ctrl+shift+P) and type `run macro` then pick which one you want to run.
4. Create a keybinding to the macro (its different from normal keybindings) -- 
Open your VS Code keybindings.json, add the name of the macro you just made to a keybinding.
NOTE: VS Code will tell you the command is invalid, ignore that and save it anyways
(see https://github.com/jeff-hykin/macro-commander/issues/1#issuecomment-505951698 as to why)
```json
{
  "key": "ctrl+cmd+/",
  "command": "macros.exampleMacro1"
}
```
Now, whenever those keys are pressed the macro commands will execute.

## Macro Elements: Commands and Modifiers
A macro element can be:

- a command which requires no arguments (quoted string syntax).
- a `command` with some `args` (json object syntax).
- a `command`, some `args`, and some `injections` that modify the arguments.
- a `javascript` script.
- a shell script that runs in a `hiddenconsole`.
- a shell script that runs in a `hiddenconsole` and some `injections` that modify the shell commands.

Javascript has access to the `vscode` object, the `window` object and the `path` object (from node path).
The `vscode` object (`vscode.commands`, `vscode.env`, `vscode.workspace`, `vscode.tasks`, etc.) is documented here: https://code.visualstudio.com/api/references/vscode-api
The `window` object is actually a synonym for `vscode.window`.
The javascript runs inside of an async function, meaning you can use the `await` keyword.

Regarding injections, the "withResultOf" argument can be a simple property ("window.activeTextEditor.document.uri.fsPath") or javascript ("await window.showInputBox()").


## What are some macro examples?
See also [Level up your Coding with Macros](http://gedd.ski/post/level-up-coding-with-macros/) 
```json

"macros": {
    "openNewTerminal": [
        // a simple command to open a new terminal (no arguments, so just name the command as a string).
        "workbench.action.terminal.new",
        // a command with arguments, that sends text to the terminal (a json object)
        {
            "command": "workbench.action.terminal.sendSequence", 
            "args": { "text": "echo hello\n" }
        },
    ],
    "printToNewTerminal" : [
        // a simple command to open a new terminal
        "workbench.action.terminal.new",
        // modify the arguments with injections
        {
            "injections" : [
                { "replace": "$currentFile", "withResultOf": "window.activeTextEditor.document.uri.fsPath" },
                { "replace": "$currentFolder", "withResultOf": "vscode.workspace.rootPath" },
            ],
            "command": "workbench.action.terminal.sendSequence",
            "args": { "text": "echo the current file is: $currentFile\necho the current folder is: $currentFolder\n" }
        },
    ],
    "showMessageViaJavascript" : [
        // javascript execution (see https://code.visualstudio.com/api/extension-capabilities/common-capabilities)
        {
            // this has access to the `vscode` object, the `window` object and the `path` object (from node path)
            // the javascript is also run inside of an async function, meaning you can use the `await` keyword
            "javascript": "window.showInformationMessage(`You entered: ${await window.showInputBox()}`)"
        },
    ],
    "userInputViaJavascript" : [
        {
            "javascript": [
                "let response = await window.showInputBox()",
                "await window.showInformationMessage(`You entered: ${response}`)",
            ]
        },
    ],
    "runShellCommandsHidden" : [
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
        // combine injections and hidden console commands
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
    "exampleWithBashProfile" : [
        {
            "injections" : [
                { "replace": "$currentFolder", "withResultOf": "vscode.workspace.rootPath" }
            ],
            // I wanted to use aliases from my bash profile
            // here's an ugly way of doing that
            "hiddenConsole" : "bash <<THE_CMD\nsource ~/.bash_profile;cd \"$currentFolder\";\necho now I can use aliases\nTHE_CMD"
        }
    ],
    "unMultiSelectLast": [
        // For when you Ctrl-Click to multiselect 10 times and on the eleventh get it wrong. 
        // Just press Ctrl-0 (or whatever key you assign) to unselect the eleventh, then carry on.
        // (See also, https://github.com/danseethaler/vscode-tab-through-selections, for more along this line.)
        {"javascript": [
            "const editor = window.activeTextEditor;",
            "const newSelections = editor.selections.slice(0, editor.selections.length - 1);",
            "editor.selections = newSelections;"
        ]}],
    "transformToSnake": [
        // A multi-select friendly macro to convert from CamelCase to snake_case.
        // If any particular selection is empty (just a cursor), this will automatically expand it to the whole word first.
        // (Kudos to https://stackoverflow.com/users/398630/brainslugs83 for some pointers)
        { "javascript": [
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
        ]}],
    "transformToCamel": [
        // Same as transformToSnake, but vice versa
        { "javascript": [
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
        ]}]
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
The original extension was made by [geddski](http://gedd.ski)
<br>I modified it to be synchronous, have javascript support, and allow named execution
<br>[polyglot-jones](https://github.com/polyglot-jones) improved the documentation and added three big examples (unMultiSelectLast, transformToSnake, transformToCamel)
