---
'@likec4/diagram': patch
'@likec4/style-preset': patch
'likec4': patch
---

Model diffs in the UI, see [discussion #1192](https://github.com/likec4/likec4/discussions/1192):

- Compare views: the view before and after the diff in one diagram, with added, removed and modified elements and relationships marked. Switch between as-is, changes and to-be modes in the playground, `likec4 start` and static builds (`likec4 build`). Vite plugin users get them from the `likec4:diffs` virtual module.
- Playground: review the changes of each file before they are applied, and roll back an applied change.
