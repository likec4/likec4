---
'@likec4/config': patch
'@likec4/language-server': patch
'likec4': patch
---

Internal restructuring for better maintainability: 
 - `@likec4/language-services` - for cross-platform language services initialization
 - `@likec4/react` - bundled version of `@likec4/diagram`
 - `@likec4/vite-plugin` - to separate concerns
