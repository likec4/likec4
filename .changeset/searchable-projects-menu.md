---
'@likec4/diagram': minor
'@likec4/spa': minor
---

Searchable, scrollable project selectors

The project selectors (navigation panel and app header) get a search field: case-insensitive,
matching project id, title and path, every whitespace-separated term must match, and `*` is a
wildcard. Arrow keys and Enter navigate the results. The list has a fixed max height and scrolls,
so workspaces with dozens of projects stay usable. The header selector now opens on click, so it
does not close while typing.
