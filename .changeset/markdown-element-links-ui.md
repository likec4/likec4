---
'@likec4/diagram': patch
'@likec4/core': patch
---

Links to elements and views in Markdown (`[[cloud.api]]`, `[[view:index]]`) now work in diagrams. They show the element or view title (or your label), with a preview card on hover or keyboard focus (title, kind, summary). In element details, relationship popovers, notes, view details, walkthrough and the sequence outline, a click (or Enter) on an element link shows that element in the details card, and a click on a view link opens the view. Broken links are dimmed and say what is missing. Inside diagram nodes, links are plain text, and they are not clickable when element details or navigation are disabled.
