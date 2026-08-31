---
'@likec4/core': patch
---

Fix `.*` (children) selector matching deeper descendants in view rules. Styles and property overrides written as `cloud.*` were applied to grandchildren like `cloud.backend.storage` as well, behaving the same as `cloud.**`. Now `.*` matches only direct children, as documented, and `.**` remains for all descendants. Affects `style` rules, `include ... with { }` overrides and relationship customizations, in both element and dynamic views.
