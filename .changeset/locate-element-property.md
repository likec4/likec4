---
'@likec4/language-server': patch
---

`locate` now honours `property` for elements and deployment nodes: it returns the range of the declaration that supplies that property (for example `technology`, `description`, `tags` or `metadata`) instead of the element name. An inline value after the name wins over the body, as in the model, a `descriptionFile` is located for `description`, and the name is still returned when the property is not declared.
