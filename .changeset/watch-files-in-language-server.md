---
'@likec4/language-server': patch
'likec4-vscode': patch
---

The language server now watches project configs, manual layout snapshots and description files itself, using file change notifications from the editor. Any LSP client gets these updates, not only VS Code, and the CLI and Vite plugin handle changes the same way.

- A changed description file (`descriptionFile`) updates the model in the editor.
- Deleting, moving or copying a folder updates the documents inside it, removes its manual layouts, and reloads the projects it contained.
- Saving a project config without actual changes (whitespace, comments) no longer rebuilds the project.
- Applying model edits no longer fails in the browser (VS Code for the Web).

`DidChangeSnapshotNotification` is removed from the language server protocol, the server no longer needs it.
