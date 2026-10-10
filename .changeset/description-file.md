---
'@likec4/language-server': patch
---

Add `descriptionFile` to reference a markdown file as the description of an element, a relation or a view. The path is resolved relative to the `.c4` file that uses it and must stay inside the project folder; a file that cannot be read is reported as an error.
