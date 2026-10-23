---
'@likec4/diagram': patch
---

Fix relationship metadata tooltip rendering under dialog overlay

The metadata info-icon tooltip in the RelationshipPopover was portaled to
`document.body`, which placed it behind any `showModal()` overlay (ElementDetails,
RelationshipDetails). The tooltip now portals into the nearest `<dialog>` ancestor
when one is present, keeping it in the top layer alongside the overlay.
