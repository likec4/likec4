---
'@likec4/core': patch
'@likec4/language-server': patch
---

Allow escaping a forward slash in a title with `\/` so it doesn't create a view folder. This also applies to element titles, so `implicitViews` no longer split an auto-generated view into an unwanted subfolder when the element's title contains a slash.
