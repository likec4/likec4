---
'likec4': patch
---

`likec4` now bundles `@likec4/core` and exposes it under the same subpaths: `likec4/core`, `likec4/core/builder`, `likec4/core/compute-view`, `likec4/core/geometry`, `likec4/core/model`, `likec4/core/styles`, `likec4/core/types` and `likec4/core/utils`. `likec4/react` and the bundled app share this single copy. If you import both `likec4` and `@likec4/core`, you now get two separate copies, so `instanceof` checks between them won't work; prefer `likec4/core/*`.
