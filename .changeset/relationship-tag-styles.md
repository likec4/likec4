---
'@likec4/core': patch
'@likec4/language-server': patch
'@likec4/generators': patch
'likec4-vscode': patch
---

Style relationships by tag or kind in element views, see [#1234](https://github.com/likec4/likec4/issues/1234): `style relationship.tag = #critical { color red }` or `style relationship.kind = async { line dotted }`, inside a view or in the `views` block to cover every element view in it. Several targets can share one rule, separated by commas, and `!=` matches the relationships without the tag or kind.
