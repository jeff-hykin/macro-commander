## What does this do?
It lets you write a quick sequence of commands/scripts to automate VS Code tasks.
Example sub-actions are; smart snippets, formatting the current file, renaming many files, pushing git changes, and running command line commands.

## How do I use it?
1. Find the name of commands you want to run (go to the VS Code keybindings.json to find the names of things)
2. Open up your VS Code settings.json and create a new section like this:
```json
"macros": {
    "exampleMacro1": [
        // put commands here
    ]
}
```
3. Open up your VS Code keybindings.json and add the name of the macro you just made to a keybinding
```json
{
  "key": "ctrl+cmd+/",
  "command": "macros.exampleMacro1"
}
```
Now whenever those keys are pressed, the macro commands will execute

## What are some examples?
See also [Level up your Coding with Macros](http://gedd.ski/post/level-up-coding-with-macros/) 
```json
"macros": {
    "exampleMacro1": [
        // a simple command for formatting a documnet
        "editor.action.formatDocument",
        // run a console command 
        {
            "command": "workbench.action.terminal.sendSequence",
            "args": { "text": "echo hello\n" }
        },
        // javascript execution (see https://code.visualstudio.com/api/extension-capabilities/common-capabilities)
        {
            "javascript": "
                let userInput = await window.showInputBox()
                window.showInformationMessage(`You entered: ${userInput}`)
            "
        },
        // combine javascript and commands
        {
            "injections" : [
                { "replace": "$currentFile", "withResultOf": "window.activeTextEditor.document.uri.fsPath" }
            ],
            "command": "workbench.action.terminal.sendSequence",
            "args": { "text": "echo $currentFile\n" }
        }
    ]
```

## Who made this?
The original extension was made by [geddski](http://gedd.ski)
I (Jeff Hykin) modified it to be synchronous, have javascript support, and allow named execution
