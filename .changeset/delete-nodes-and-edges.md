---
'@likec4/diagram': patch
---

Support deleting elements/edges in the diagram editor (except dynamic views). Selecting nodes (and/or edges) and pressing delete now removes them from the view, automatically dropping any edges connected to a deleted node. The change is added to undo/redo history.
