---
'@likec4/core': patch
'@likec4/diagram': patch
'@likec4/style-preset': patch
---

Tags with custom hex / rgb colors now get an accurate text color derived from the background via APCA contrast, instead of the previous CSS-filter workaround. `TagStylesProvider` emits `--colors-likec4-tag-text` for all tags (custom-colored and named), and the `autoTextColor` variant is removed from the `likec4tag` recipe. `getContrastedColorsAPCA` is now exported from `@likec4/core/styles`. Resolves #2143.
