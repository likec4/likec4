---
'likec4': patch
---

Fix favicon 404 in `likec4 build --output-single-file`. The single-file build inlines JS/CSS but left the favicon `<link rel="icon">` as an external reference to a hashed asset, which the post-build cleanup then removed — leaving a dangling reference that 404s wherever the standalone HTML is served. The favicon is now inlined as a base64 data URI before cleanup, so the single HTML file stays self-contained. Only `--output-single-file` is affected; the regular multi-file build is unchanged.
