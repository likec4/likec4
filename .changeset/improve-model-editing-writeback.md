---
'@likec4/core': patch
'@likec4/language-server': patch
---

Improve how edits made from the UI are written back to the source:

- Element style rules are inserted inside the view body with correct indentation, and existing style properties are updated in place instead of drifting.
- View tags are written as a complete set. Clearing the last tag removes the tags line, and `ViewChange.ChangeProperty` now takes `tags` instead of `tag: { add, remove }`.
- Renaming a view no longer repeats the folder path it already lives in.
- Elements no longer report tags that are missing from the specification, which could happen for imported elements. `LikeC4Model.tagsFromSpecification` returns all declared tags.
