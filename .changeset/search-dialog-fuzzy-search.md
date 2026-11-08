---
'@likec4/diagram': patch
---

The Search dialog now uses fuzzy search for elements and views, the same as the `search-element` tool of the MCP server. A word can have a typo ("chekout" finds "checkout") and every word has to match the name, title, id or description. The `kind:` and `#tag` searches and the search by element path (`cloud.backend`) work as before.
