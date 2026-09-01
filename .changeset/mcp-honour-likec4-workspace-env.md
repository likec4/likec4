---
'likec4': patch
---

Fix `likec4 mcp` ignoring the `LIKEC4_WORKSPACE` environment variable. The command overrode the shared `path` default, so the workspace always fell back to the current directory and the server silently served an empty model. Behaviour now matches the documented help text and the other commands.
