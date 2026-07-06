---
'@likec4/mcp': minor
'@likec4/language-server': minor
---

Add `preview-view` MCP tool that renders a preview of a LikeC4 view defined by DSL text within the context of an existing project's real elements, without saving changes to disk. If the view ID matches an existing view, that view is previewed with the replaced definition; otherwise it is previewed as a new draft. This allows users to experiment with view definitions before committing them.
