---
'@likec4/language-server': patch
---

Fix keyword completions inserting the keyword twice (e.g. `modelmodel`) in editors other than VS Code. Snippet and property completions now provide an explicit text edit that replaces the typed prefix, instead of relying on the client to prefer it over the plain insert text.
