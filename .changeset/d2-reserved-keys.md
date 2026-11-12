---
'@likec4/generators': patch
---

D2 export now compiles when an element is named like a D2 keyword (`label`, `icon`, `link`, `top`, `width`, ...), when a title or label contains `${`, and for views with groups. Element keys are quoted, `${` is escaped, and children of a group keep their names.
