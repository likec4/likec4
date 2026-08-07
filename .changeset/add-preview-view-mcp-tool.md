---
'@likec4/mcp': patch
'@likec4/language-server': patch
---

Add `preview-view` MCP tool that renders a preview of a LikeC4 view defined by DSL text within the context of an existing project's real elements, without saving changes to disk. If the view ID matches an already existing view, an error is returned. This allows users to experiment with view definitions before adding them to the project.
