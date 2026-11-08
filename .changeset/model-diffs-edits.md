---
'@likec4/core': patch
'@likec4/language-server': patch
'@likec4/language-services': patch
'@likec4/mcp': patch
'likec4': patch
---

Model diffs: apply, discard and safe delete, see [discussion #1192](https://github.com/likec4/likec4/discussions/1192):

- Apply or discard a diff: the `add` blocks are merged into the element definitions of the model files. Code actions in the editor, `likec4 diff list`, and `likec4 diff apply|discard [--dry-run]`.
- Overlapping diffs (both change the same element or relationship, or one depends on the other) are reported on both diffs and never resolved automatically: applying an overlapping diff needs a confirmation (`--accept-overlaps`). Other diffs are never edited; the diffs an edit breaks are reported.
- Safe delete: remove an element and everything that references it in one edit, with a dry run that reports relationships, deployed instances, affected views and orphans. Code action in the editor, `likec4 safe-delete [--dry-run]`, and the MCP tools `removal-impact` and `list-diffs`.
