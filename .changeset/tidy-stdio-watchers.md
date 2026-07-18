---
"@likec4/mcp": patch
"likec4": patch
---

Stop stdio MCP servers when the client closes stdin so file watchers are cleaned up instead of leaving orphaned processes.
