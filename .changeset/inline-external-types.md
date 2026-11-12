---
'likec4': patch
'@likec4/language-server': patch
---

Type declarations of `likec4/react` and `likec4/generators/likec4` no longer import `d3-zoom` and `chevrotain`, which `likec4` does not install. Projects that type-check libraries (`skipLibCheck: false`) no longer fail with "Cannot find module".

`DidRequestOpenViewNotification` is removed from `@likec4/language-server/protocol`. Nothing sent it since the MCP `open-view` tool was dropped.
