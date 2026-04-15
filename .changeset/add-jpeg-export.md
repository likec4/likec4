---
'likec4': patch
---

Add JPEG export support for architecture diagrams:

- New "Export as .jpg" option in the web UI Export menu
- New `likec4 export jpg` CLI command with `--quality` option (1–100, default 80)
- JPEG export renders with a solid background (adapts to light/dark theme), making it convenient for pasting into documents and chats
