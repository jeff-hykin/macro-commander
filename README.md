## What does this do?
It lets you write a quick sequence of commands/scripts to automate VS Code tasks.
Example sub-actions are; running command line commands, opening a debugging session, pushing git changes, renaming many files, creating smart snippets, formatting the current file and more.

## What are some use-case examples?
- A run command that opens up a terminal, starts an SSH connection, and then runs commands on the SSH server
- A new-project command that goes to where ever you typically save projects, uses the GUI to ask for the name of the project, creates the folder, creates a .gitignore with your preferences, runs an init command, and then opens the folder in your current VS Code window.
- A command that opens a project folder, pulls the latest changes, opens several files in that folder, and then displays the recent changes in those files.
- A folder-specific start command, that pulls the latest changes, installs dependiences, formats files, and then opens the debugger with a specific file.

## How do I use it?
1. Find the name of commands you want to run 
Do can do this by going to the VS Code keybindings.json
(go to gear-icon -> keybindings, then press the {}'s in the top right corner)
All of the `"command":`'s can be copied and pasted into the macro
2. Open up your VS Code settings.json and create a new section like this:
(go to gear-icon -> settings, then press the {}'s in the top right corner)
```json
"macros": {
    "exampleMacro1": [
        "macro.this.is.a.real.dummy.command"
    ]
}
```
3. To run the macro open the command pallet (cmd+shift+P or ctrl+shift+P) and type `run macro` then pick which one you want to run.
4. Create a keybinding to the macro (*its different from normal keybindings)
Open up your VS Code keybindings.json, add the name of the macro you just made to a keybinding
NOTE: VS Code will tell you the command is invalid, ignore that and save it anyways
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
```json
"macros": {
    "exampleMacro1": [
        // a simple command to open a new terminal
        "workbench.action.terminal.new",
        // a command with arguments, that sends text to the terminal
        {
            "command": "workbench.action.terminal.sendSequence", 
            "args": { "text": "echo hello\n" }
        },
    ],
    "exampleMacro2" : [
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
    "exampleMacro3" : [
        // javascript execution (see https://code.visualstudio.com/api/extension-capabilities/common-capabilities)
        {
            // this has access to the `vscode` object, the `window` object and the `path` object (from node path)
            // the javascript is also run inside of an async function, meaning you can use the `await` keyword
            "javascript": "window.showInformationMessage(`You entered: ${await window.showInputBox()}`)"
        },
    ],
    "exampleMacro4" : [
        {
            "javascript": [
                "let response = await window.showInputBox()",
                "await window.showInformationMessage(`You entered: ${response}`)",
            ]
        },
    ],
    "exampleMacro5" : [
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
            // I wanted to use aliases from my bash profile
            // here's an ugly way of doing that
            "hiddenConsole" : "echo $userInput"
        }
    ]
}
```

## Who made this?
The original extension was made by [geddski](http://gedd.ski)
<br>I modified it to be synchronous, have javascript support, and allow named execution
