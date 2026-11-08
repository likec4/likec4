---
'likec4': patch
'@likec4/language-services': patch
---

`likec4 validate` prints warnings and accepts `--max-warnings <n>` to fail when there are more than `n` warnings, so CI can fail on any warning with `--max-warnings 0`. Without the flag, warnings do not change the result or the exit code. JSON output adds `warnings`, `maxWarnings`, and `totalWarnings`/`filteredWarnings` stats; `--file` limits warnings the same way as errors.

`LikeC4` adds `getWarnings()`, which returns validation warnings in the same shape as `getErrors()`.
