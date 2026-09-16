---
'@likec4/generators': patch
---

Fix Mermaid export producing invalid output for views with a `group`. The subgraph id no longer starts with `@`, which Mermaid reserves for the `node@{ ... }` shape syntax, and grouped elements keep their own ids instead of being truncated by the length of the generated group id (which left short ids, such as `auth`, with an empty id).
