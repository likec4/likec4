---
'likec4-vscode': patch
---

Copy as PNG and Save as PNG now use the `likec4` package installed in the exported project (including nested monorepo packages and Yarn PnP), and the new `likec4.cli.path` setting points them to a specific CLI. When the CLI is missing, the error offers to install it with your package manager.
