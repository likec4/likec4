# View note cards for regular diagrams

Date: 2026-09-29

Status: Approved for implementation

## Purpose

The existing `notes` view override stores Markdown or plain text for an element or relationship. Regular diagrams currently show an element note as a folded-paper control that opens on click. A relationship note has no comparable visible card. The user wants the note text visible beside its target, with a short, straight, dashed line that makes ownership clear.

This design uses the existing view-scoped value. Authors put notes in `.c4` view definitions:

```likec4
views {
  view overview {
    include api with { notes 'Owned by Platform' }
    include api -> db with { notes 'Retries for 30 seconds' }
  }
}
```

The feature is associated with [#2567](https://github.com/likec4/likec4/issues/2567). It adds automatic placement but does not add the author-controlled positioning requested in [#2929](https://github.com/likec4/likec4/issues/2929). Sequence-note work in [#2475](https://github.com/likec4/likec4/issues/2475) stays separate.

## Scope and behavior

- Show one card for each **rendered** element, deployment, compound, or relationship edge that has a nonempty computed `notes` value. A hidden or filtered target has no card. For a merged relationship edge, use that rendered edge's computed `notes` value once; do not collect or concatenate underlying model relationships.
- Apply this to element and deployment views and to dynamic views in diagram mode. In regular diagrams, the card replaces the folded-paper control. Dynamic sequence mode keeps its current note behavior.
- Keep `enableNotes` as the host switch. When it is false, render neither a card nor the old control. No new per-view flag is added.
- Show the complete note content at a fixed width of 240 diagram units. Height grows with content. Do not truncate, scroll within the card, collapse it, or require a click to read it. The width is a design default that can be tuned during visual validation without changing the data contract.
- Render the existing Markdown or plain-text value with the current Markdown renderer. Keep links usable. Scale images to fit the card width. An image load or error can change card height and must trigger remeasurement.
- Style the card as muted warm paper with a small folded corner, subtle border and shadow, and legible text in both light and dark themes. Reuse LikeC4 theme tokens where possible. Do not add a large title or a second action toolbar.
- Draw one straight dashed leader from the nearest card boundary to the target. For an element, end it at the element boundary. For a relationship, end it at the midpoint by rendered path length. Add a small dot at the target end. The leader does not intercept pointer input.
- Keep cards read-only and text selectable. A card click or link click must not select or drag the target or start canvas panning. The rest of the target remains interactive. Give each card an accessible name that identifies its element or relationship; mark the decorative leader hidden from assistive technology.

The card is visible when the rendered note has nonempty text, using the existing `RichText` empty check. A note removed from `.c4` removes its card after the model updates, including when the view uses a saved manual layout.

### Host behavior

| Host                                                           | First-version behavior                                                                      |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Full SPA diagram and editor, VS Code preview (`LikeC4Diagram`) | Cards on by the existing `enableNotes=true` default.                                        |
| SPA full-size embed (`EmbedPage`)                              | Explicitly enable cards and size the embed from measured content bounds.                    |
| SPA and CLI PNG/JPG export (`ExportPage`)                      | Cards on; wait for measured content before capture.                                         |
| Static thumbnails                                              | Cards off.                                                                                  |
| Public `LikeC4View`                                            | Keep its current default off; `enableNotes=true` shows cards and uses measured bounds.      |
| `StaticLikeC4Diagram`                                          | Keep its current default off; allow an explicit `enableNotes=true` for the full-size embed. |

The repository has no native LikeC4 SVG export. This feature adds none.

## Architecture and data flow

1. Parse the existing view `with { notes ... }` override. Do not change the grammar, model-level element or relationship types, DSL generator, Vite virtual modules, or RPC.
2. Use the `notes` values already present on computed and XYFlow nodes and edges. Render cards only for visible regular-diagram targets when `enableNotes` is true.
3. Put a diagram-level note layer inside `packages/diagram`. Render cards and leaders in the XYFlow viewport coordinate space as presentation overlays. Do not add Graphviz nodes, XYFlow architecture nodes or edges, a new XState actor, or persisted card IDs/positions. This keeps cards out of edit selection, relationship counts, and manual-layout snapshots.
4. Render each card invisibly at its fixed diagram-unit width for an initial measurement with the active theme and font. Compute placement from the measured size, then show the card and leader. A later image load or resize can update their placement. Keep this derived geometry transient in the existing diagram UI. A small diagram-to-host callback reports the combined content bounds and readiness; it does not fetch or mutate model data.
5. Merge measured card and leader bounds with the existing view bounds for full-view fitting. Store the current derived bound only in the existing diagram UI context. All full-view fit entry points, including initial fit, toolbar, keyboard reset, and diagram navigation, must use that combined bound. On first load, refit once after note measurement unless the user has already moved the viewport. Panning or zooming alone does not rerun placement because cards use diagram coordinates.
6. When view data, note text, target position/path, card size, font, or theme changes, recompute as needed. After a completed manual node or edge move, rerun placement. During a drag, keep the leader attached to the current target anchor; finalize card placement on drop. HMR note edits add, update, or remove cards without rebuilding the model transport.

The diagram component exposes a presentation callback with `{ bounds, ready }` for `LikeC4View`, `EmbedPage`, and `ExportPage`. `bounds` is the union of architecture, card, and leader extents in diagram coordinates. `ready` means the note layer has finished its current measurement and placement pass. Hosts can update their containers without making `packages/diagram` depend on the SPA or language server. The saved `LayoutedView.bounds` remains the architecture layout bound; live card geometry does not enter the serialized model.

## Automatic placement

- Process target cards in a stable order: elements by rendered ID, then relationship edges by rendered ID.
- For an element, try eight positions around its boundary: right, lower-right, below, lower-left, left, upper-left, above, upper-right. For a relationship, try the positive and negative path normal at its midpoint, then right, below, left, and above. Use a 24-unit gap between the target anchor and card boundary. If the path tangent is degenerate, use the horizontal normal first.
- Score each candidate lexicographically: first overlap area with interactive element bodies, edge labels, and already placed cards; then crossings of non-target edges or existing leaders; then leader length; then the fixed candidate order. Compound container backgrounds do not block a card in their free interior space, but their headings do.
- Pick the lowest-score candidate. If every candidate overlaps, still render the lowest-score card and its target dot/leader. The first version is best effort in dense views. It neither moves Graphviz nodes nor adds an author placement hint. No claim of overlap-free layout is made.
- Use measured dimensions and the same scoring code in interactive, embedded, and export renders. Stable target and candidate order prevent random repositioning. Zoom changes the screen size of the card with the diagram; it does not change its diagram-unit width or placement.

## Export and readiness

`ExportPage` currently sizes a clipping container from `pickViewBounds`, and CLI screenshot capture currently waits only for `.react-flow.initialized`. Both are insufficient for post-layout cards.

The note layer first reports a provisional layout bound, then a final combined bound after cards are placed. `ExportPage` and the full-size embed recompute container size and translation when that bound changes. The export page exposes a ready marker only after the updated size and translation have committed to the DOM. Browser PNG/JPG download and CLI Playwright screenshot wait for that marker, not a fixed delay. With no enabled notes, the host sets the marker after ordinary diagram initialization and container commit, without an extra card measurement wait.

For a noted view, readiness requires fonts ready, all card images loaded or failed, card sizes measured, placement and leaders committed, and host bounds updated. Image failure may leave the browser's broken-image/alt presentation, but measurement must reflect that final state. If readiness does not arrive within the export timeout, report an export error instead of silently capturing a cropped diagram. Recompute bounds after a late image or font size change before marking ready. Existing PNG and JPG paths use the same rule.

## Saved manual layout

Card positions are derived after manual layout is applied. They are never written to a manual-layout snapshot and do not create geometry drift entries.

`applyManualLayout.ts` currently retains an old edge note when the next computed edge has no note (`next.notes ?? edge.notes`). Change that branch so the note value in the current `.c4` view is authoritative on addition, text change, and removal. Preserve the existing `notes-changed` drift signal for edge note presence changes unless it prevents the current value from rendering. The node-note path already removes stale notes and has a regression test; keep that behavior. Add a focused edge removal regression.

## Validation and release

- Test the placement utility with fixed card measurements: stable order, a free nearby position, and the least-overlap fallback. Test anchor/leader endpoints for an element and a rendered relationship path.
- Test rendering of one element card and one relationship card, complete long text, no old folded control in regular mode, and no cards when `enableNotes=false`. Confirm dynamic diagram mode shows cards while sequence mode retains current behavior.
- Test edge-note removal under saved manual layout. Confirm HMR or view replacement updates a card and target movement updates its leader without storing a card position.
- Test combined bounds in both fit entry points and a PNG/JPG export fixture whose long card extends beyond the original layout bound. Assert capture waits for the ready marker and does not clip the card or leader. Include an image-bearing Markdown note to check remeasurement.
- Visually check light and dark themes, a dense view, readable target ownership, full-size embed sizing, and thumbnail behavior. Keep these checks focused on the design risks above.
- Add a patch changeset for the user-visible change. State that existing notes in regular diagrams become visible cards and can enlarge fitted and exported diagrams. Note that author placement and sequence cards remain outside this release.

## Limits and alternatives

Post-layout cards can overlap diagram content in a dense view. This is the accepted first-version trade-off for existing view-scoped notes and no new syntax. The dashed leader and target dot must keep ownership legible. If visual validation shows an unacceptable case, adjust candidate scoring within this design; adding position syntax or Graphviz note nodes requires a later design decision.

The alternatives considered were synthetic Graphviz note nodes, which would change topology, routing, stable IDs, and manual layout, and a first-class note entity with position syntax, which would widen the grammar/model/editor surface. The user selected post-layout rendering with existing `notes` for the first version.
