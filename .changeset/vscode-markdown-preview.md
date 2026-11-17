---
'likec4-vscode': patch
---

Render ```` ```likec4-view ```` fenced code blocks natively inside VS Code's built-in Markdown preview, reusing the active LikeC4 language server and supporting `mkdocs-likec4` block syntax (`project=`, `browser=`, `dynamic-variant=`, `color-scheme=`) with instant static SVG placeholders, stale-state preservation on `.c4` errors, live updates on unsaved `.c4` edits, and configuration settings (`likec4.markdownPreview.{enabled,colorScheme,maxHeight,maxModelBytes}`).
