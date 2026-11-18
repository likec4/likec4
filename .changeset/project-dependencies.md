---
'@likec4/config': patch
'@likec4/core': patch
'@likec4/language-server': patch
'likec4': patch
'@likec4/lsp': patch
'@likec4/mcp': patch
'likec4-vscode': patch
---

Experimental `dependencies` section in the project config: declare the projects you import from, as paths to their folders relative to the config file, for example `"dependencies": { "billing": "../billing-service" }`.

- Import a project under a name of your choice: `import { invoices } from 'billing'` works even if the project is named differently. An entry in `dependencies` takes precedence over a workspace project with the same name.
- Import from a project outside the opened folder. LikeC4 reads its `.c4` and `.likec4` files and its JSON config, and uses it only as a source of elements: its errors are not reported and its views are not built. Changes in it are picked up after you reload projects.
- In the projects overview, a project imported from outside the workspace is shown as a separate node.

Workspaces without `dependencies` work as before: `import ... from 'name'` still finds a workspace project by its name. The format of `dependencies` may change before it becomes stable. See [Multi-projects](https://likec4.dev/config/multi-projects/#dependencies).
