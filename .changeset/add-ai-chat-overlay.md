---
'@likec4/config': patch
'@likec4/core': patch
'@likec4/diagram': patch
'@likec4/likec4': patch
'@likec4/vite-plugin': patch
'@likec4/vscode-preview': patch
'@likec4/vscode': patch
'@likec4/language-server': patch
---

Add AI Chat overlay for exploring architecture elements directly from diagrams:

- Chat with any OpenAI-compatible LLM about elements and relationships
- Reasoning/thinking display with collapsible blocks
- Configurable via `aiChat` in `likec4.config.json` (disabled by default)
- Custom suggested questions with template variable interpolation
- VSCode extension support via CORS proxy
