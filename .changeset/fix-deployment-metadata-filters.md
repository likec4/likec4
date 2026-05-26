---
'@likec4/core': patch
---

Fix deployment relationship filters so source and target metadata predicates use deployed instance metadata.
Instance metadata replaces, not merges with, model element metadata, matching existing deployment model semantics.
