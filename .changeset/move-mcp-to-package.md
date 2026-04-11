---
'@likec4/mcp': patch
'@likec4/language-server': patch
'@likec4/language-services': patch
'likec4': patch
'likec4-vscode': patch
---

Extract MCP server and toolst to `@likec4/mcp` package. This will allow us to reuse MCP server and tools in other projects, and also will make the codebase cleaner and more modular.
