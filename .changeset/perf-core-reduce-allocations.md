---
'@likec4/core': minor
---

Add `forEachAncestorFqn` visitor utility and improve hot-path performance

- Add `forEachAncestorFqn` to `@likec4/core` utils: zero-allocation ancestor traversal with early-exit support
- Reduce transient allocations in `computedModel()` hot path (~6-9% faster, ~38% less transient heap on large workspaces)
- Rewrite `linkNodesWithEdges` with a zero-allocation LCA algorithm
- Optimize `topologicalSort` with Map-based O(1) lookups replacing O(n²) array scans
- Add `findRelations` memoization in `DynamicViewCompute`
