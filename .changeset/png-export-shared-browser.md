---
'likec4': patch
---

`likec4 export png` and `likec4 export jpg` start one browser for all projects instead of one per project, and capture views in parallel. Use the new `--concurrency` (`-j`) option to set how many views are captured at once (default 4). If some views fail, the export now finishes all projects first and then reports the failures for each project.
