---
'@likec4/generators': patch
---

Draw.io export: HTML-escape relationship labels (their cells use `html=1`), so `<`, `>` and `&` in a label show up in draw.io instead of being read as markup. Draw.io import: strip tags before decoding entities, so titles and labels with `<`, `>` or `&` keep that text.
