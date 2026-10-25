---
'@likec4/diagram': patch
---

Fix ElementDetailsCard throwing when the navigation target view is absent from a partial model. The "Open default view" button now passes the raw view ID to the consumer's onNavigateTo callback instead of resolving it through a strict model lookup that throws for views outside the current model slice.
