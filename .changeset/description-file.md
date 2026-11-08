---
'@likec4/language-server': patch
---

Add `descriptionFile` to reference a markdown file as the description of an element, a relation or a view. The path is resolved relative to the `.c4` file that uses it and must stay inside the project folder; the folder and the file are both canonicalized, so a symbolic link that points outside the project is refused too. A file that cannot be read is reported as an error.
