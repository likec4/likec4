---
'@likec4/core': patch
'@likec4/language-server': patch
'@likec4/layouts': patch
'@likec4/generators': patch
---

Lay out relationships backwards in element and deployment views, like `x <- y` in PlantUML. Write `producer <- consumer` or `producer <-[subscribes]- consumer` in a `model` or `deployment` block to define a relationship from `consumer` to `producer` that is placed producer-first by the automatic layout. The same layout hint is available as the `direction back` style property on a relationship, on a relationship kind in `specification`, or per view with `include ... with { direction back }` (or `direction forward` to turn it off). The relationship keeps its semantic direction: the arrow, view predicates, relationship details and navigation are unchanged. When several relationships are merged into one edge, the edge is laid out backwards only if all of them are. Dynamic views are not affected.
