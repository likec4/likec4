---
'@likec4/spa': patch
---

Fixed sidebar navigation drawer rendering every view as an empty expandable folder: view leaf nodes carried an empty `children` array, which Mantine Tree treats as "has children", so views got a folder icon and lost click navigation
