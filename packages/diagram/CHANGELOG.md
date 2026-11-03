# @likec4/diagram

## 1.60.1

### Patch Changes

- [`cfa6975`](https://github.com/likec4/likec4/commit/cfa697584f1d7e5e66719569f88e24e092269080) Thanks [@davydkov](https://github.com/davydkov)! - Element details put the description first: technology, links and metadata move to a sidebar that can be resized or hidden (the layout is remembered), and element kind and tags move to the footer of the card. The card remembers its size after you resize it and stays inside the window when dragged; double-click its title or the resize handle to reset its size and position.
  
  The card header shows the element id; hover a part of it to highlight the path to that parent. When an element has a summary that differs from its description, the summary is collapsed above the description and expands on click.
  
  Metadata shows every value at once. Click a key or a value to find other elements with the same metadata. Search supports `meta:key` and `meta:key=value` queries.
  
  The style preset adds a `fieldLabel` text style for small all-caps field labels.

- [#3458](https://github.com/likec4/likec4/pull/3458) [`6361dbc`](https://github.com/likec4/likec4/commit/6361dbc62c8f7c198d4721fce9cdfb4ca66ce0ef) Thanks [@edeak-jsq](https://github.com/edeak-jsq)! - Element details, relationship details, and the relationship browser stay available on compare views, including elements a diff adds or removes. The details card shows the diff status.

- [#3489](https://github.com/likec4/likec4/pull/3489) [`9d672fe`](https://github.com/likec4/likec4/commit/9d672fe710ecaa52619f152c2b31d53eee619f82) Thanks [@davydkov](https://github.com/davydkov)! - Copy an element id from the details card: click any part of the `ID` to copy the path up to it (the last part copies the full id). Works with the keyboard too, and for deployment nodes.

- [#3362](https://github.com/likec4/likec4/pull/3362) [`53caf3d`](https://github.com/likec4/likec4/commit/53caf3d9298cb993798bf35b5d9bca28630242b4) Thanks [@AndersHogqvist](https://github.com/AndersHogqvist)! - Add details popups for deployment nodes and deployed instances, showing descriptions, links, metadata, views, and deployment structure. Instance details respect overrides and provide access to the logical element's details.
  
  Implements [likec4/likec4#2373](https://github.com/likec4/likec4/issues/2373).

- [#3503](https://github.com/likec4/likec4/pull/3503) [`be65d6c`](https://github.com/likec4/likec4/commit/be65d6c93d61f3444a9889e3ea1b38092da151e7) Thanks [@davydkov](https://github.com/davydkov)! - Comparing the manual layout with the latest auto layout is now a dedicated diagram mode. Closing the comparison, navigating to another view or printing always returns to the manual layout. This also fixes the VS Code preview, which kept showing the next view in auto layout after you navigated away while comparing. The comparison is no longer restored after a page reload.
  
  `DiagramApi` gets `startCompare()` and `endCompare()`, and `toggleFeature()` now accepts only `'ReadOnly'`. Replace `toggleFeature('CompareWithLatest')` with these methods.

- [`cfa6975`](https://github.com/likec4/likec4/commit/cfa697584f1d7e5e66719569f88e24e092269080) Thanks [@davydkov](https://github.com/davydkov)! - Escape closes the search opened on top of element details, instead of closing the details card. Arrow keys move the caret in the search input while an element is selected.

- [#3446](https://github.com/likec4/likec4/pull/3446) [`24b4f44`](https://github.com/likec4/likec4/commit/24b4f44d32f683ecef924ee8f43ad4b472964f98) Thanks [@SwastikTripathi](https://github.com/SwastikTripathi)! - Fix Graph view element labels invisible in light mode. Labels were using `--likec4-palette-hiContrast`, which is the high-contrast color relative to an element's fill, so they appeared near-white on a light canvas. They now use the canvas-appropriate default text color.

- [#3455](https://github.com/likec4/likec4/pull/3455) [`5ad0ce6`](https://github.com/likec4/likec4/commit/5ad0ce604740d6c6d018f31bc8900a55606fab22) Thanks [@SwastikTripathi](https://github.com/SwastikTripathi)! - Fix relationship metadata tooltip rendering under dialog overlay
  
  The metadata info-icon tooltip in the RelationshipPopover was portaled to
  `document.body`, which placed it behind any `showModal()` overlay (ElementDetails,
  RelationshipDetails). The tooltip now portals into the nearest `<dialog>` ancestor
  when one is present, keeping it in the top layer alongside the overlay.

- [#3389](https://github.com/likec4/likec4/pull/3389) [`3928222`](https://github.com/likec4/likec4/commit/3928222677937716bec5fe3f0999362cbba0dd27) Thanks [@AndersHogqvist](https://github.com/AndersHogqvist)! - Add Google Material Symbols support through the `md:` icon prefix.

- [#3492](https://github.com/likec4/likec4/pull/3492) [`fa426c4`](https://github.com/likec4/likec4/commit/fa426c42d456da772cba5d8f5735fd99885d8c3f) Thanks [@davydkov](https://github.com/davydkov)! - Links to elements and views in Markdown (`[[cloud.api]]`, `[[view:index]]`) now work in diagrams. They show the element or view title (or your label), with a preview card on hover or keyboard focus (title, kind, summary). In element details, relationship popovers, notes, view details, walkthrough and the sequence outline, a click (or Enter) on an element link shows that element in the details card, and a click on a view link opens the view. Broken links are dimmed and say what is missing. Inside diagram nodes, links are plain text, and they are not clickable when element details or navigation are disabled.

- [#3497](https://github.com/likec4/likec4/pull/3497) [`1ebadfd`](https://github.com/likec4/likec4/commit/1ebadfd4b9f0a90e0bee08e152f76a4b389d166e) Thanks [@davydkov](https://github.com/davydkov)! - Hover cards of element and view links in Markdown show the element icon or the view type icon, and an "Open details" / "Open view" button instead of the hint text.

- [#3494](https://github.com/likec4/likec4/pull/3494) [`5d6ba6b`](https://github.com/likec4/likec4/commit/5d6ba6bc428fdbf6a224cdb2b65187ca162d8a45) Thanks [@davydkov](https://github.com/davydkov)! - Relationship labels are measured with the diagram font (IBM Plex Sans) during layout, so the space reserved for a label matches the rendered label exactly and labels no longer overlap or leave extra gaps. Long labels wrap by width into balanced lines instead of by character count.
  
  In the relationships browser and relationship details, labels are laid out together with elements: they no longer overlap each other, and every relationship goes through its label.
  
  Elements are measured the same way: an element keeps the width of its size and grows in height only when its title, technology and description do not fit. Technology is always shown on a single line.
  
  The style preset exports `EdgeLabelMetrics`, `ElementNodeMetrics` and `DefaultFontFamily` from `@likec4/style-preset/defaults`, the metrics used by both the label styles and the layouts.

- [#3366](https://github.com/likec4/likec4/pull/3366) [`250bd2c`](https://github.com/likec4/likec4/commit/250bd2c4ec45c5ee24c54844cf9a0bb64d653140) Thanks [@edeak-jsq](https://github.com/edeak-jsq)! - Model diffs in the UI, see [discussion #1192](https://github.com/likec4/likec4/discussions/1192):
  
  - Compare views: the view before and after the diff in one diagram, with added, removed and modified elements and relationships marked. Switch between as-is, changes and to-be modes in the playground, `likec4 start` and static builds (`likec4 build`). Vite plugin users get them from the `likec4:diffs` virtual module.
  - Playground: review the changes of each file before they are applied, and roll back an applied change.

- [#3476](https://github.com/likec4/likec4/pull/3476) [`6994a02`](https://github.com/likec4/likec4/commit/6994a024dc4a789967df5d2702d7bd4d2f271e42) Thanks [@AbdelrhmanAiiob](https://github.com/AbdelrhmanAiiob)! - The Search dialog now uses fuzzy search for elements and views, the same as the `search-element` tool of the MCP server. A word can have a typo ("chekout" finds "checkout") and every word has to match the name, title, id or description. The `kind:` and `#tag` searches and the search by element path (`cloud.backend`) work as before.

- [#3477](https://github.com/likec4/likec4/pull/3477) [`e24ce42`](https://github.com/likec4/likec4/commit/e24ce42a1560d74c4f76cee71c0ed06270c760d3) Thanks [@SwastikTripathi](https://github.com/SwastikTripathi)! - Show the folder path of a view in the search dialog and the "Select view" picker, for example `Systemlandscape / Target` instead of just `Target`, and match folder names when searching views.

- [#3467](https://github.com/likec4/likec4/pull/3467) [`65d60b8`](https://github.com/likec4/likec4/commit/65d60b82affcbd39d194c44cba55bf6a8918332e) Thanks [@SwastikTripathi](https://github.com/SwastikTripathi)! - Navigation thumbnails of dynamic views with `variant sequence` now show the sequence layout instead of a flow layout fitted into the wrong bounds.

- [`d1f5178`](https://github.com/likec4/likec4/commit/d1f51781912a64284403e707f734379699acc385) Thanks [@davydkov](https://github.com/davydkov)! - The style preset ships smaller CSS: it defines only the color tokens tags need, per default tag color: `likec4.tag.<color>.bg`, `likec4.tag.<color>.bg.hover`, `likec4.tag.<color>.border` and `likec4.tag.<color>.text`.
  
  `@likec4/core/styles` exports `isDefaultTagColor`.
- Updated dependencies [[`aaa53f4`](https://github.com/likec4/likec4/commit/aaa53f42e7e3d20aa0cc85b7c63b4d2b1753738c), [`3928222`](https://github.com/likec4/likec4/commit/3928222677937716bec5fe3f0999362cbba0dd27), [`c5eaa85`](https://github.com/likec4/likec4/commit/c5eaa85423a74f43f3e233e3c2db5aade1b9ed12), [`fa426c4`](https://github.com/likec4/likec4/commit/fa426c42d456da772cba5d8f5735fd99885d8c3f), [`fa426c4`](https://github.com/likec4/likec4/commit/fa426c42d456da772cba5d8f5735fd99885d8c3f), [`3a4bb8b`](https://github.com/likec4/likec4/commit/3a4bb8bd62ff1ce2af560d6280622cd5908395c6), [`b7ebce3`](https://github.com/likec4/likec4/commit/b7ebce3c1cdd0f9d92ff284a82e09e07b76f935d), [`ca1ba7b`](https://github.com/likec4/likec4/commit/ca1ba7b20116671ac1d2c3a71408d5e504e21989), [`c313fb0`](https://github.com/likec4/likec4/commit/c313fb0ad5428e6cec5f752dcdf0d290a686b0dc), [`9e106b8`](https://github.com/likec4/likec4/commit/9e106b8d205b589d49e9c72d2a80dcdfb74a4aa1), [`d1f5178`](https://github.com/likec4/likec4/commit/d1f51781912a64284403e707f734379699acc385)]:
  - @likec4/core@1.60.1
  - @likec4/styles@1.60.1

## 1.60.0

### Patch Changes

- [#3310](https://github.com/likec4/likec4/pull/3310) [`1fb8e00`](https://github.com/likec4/likec4/commit/1fb8e00a8324bcd4a691025b6228e445150dcc6a) Thanks [@davydkov](https://github.com/davydkov)! - Add new `agent` element shape

- [#3223](https://github.com/likec4/likec4/pull/3223) [`e8f3404`](https://github.com/likec4/likec4/commit/e8f340445f1391b183c7dbf56960258cebbc3346) Thanks [@m-arrieta-r](https://github.com/m-arrieta-r)! - Add a "Graph" display variant for element views, alongside the existing "Diagram" view. It renders elements as compact circles with straight relationship lines, making it easier to see the topology of larger views. Switch between them with the new Diagram/Graph toggle in the navigation panel. In Graph mode, nodes are draggable and animated with a physics-based simulation (repulsion, springs along relationships, and a settle-back bounce), similar to Structurizr's Explore view.

- [#3278](https://github.com/likec4/likec4/pull/3278) [`3e1abd7`](https://github.com/likec4/likec4/commit/3e1abd7365dfc2d2fa749415fbef64580ef71c75) Thanks [@alexhelkar](https://github.com/alexhelkar)! - Switch edge routing between `spline` and `ortho` from the diagram editor's layout panel. The choice is written to the view source as the `routing` property or as the `autoLayout` routing parameter, and stays available for views with a manual layout. Changing the auto-layout direction no longer drops a routing parameter set on the `autoLayout` rule.

- [#3295](https://github.com/likec4/likec4/pull/3295) [`e563800`](https://github.com/likec4/likec4/commit/e5638001c7aeea12b1c9634d5456f837051b3617) Thanks [@cry999](https://github.com/cry999)! - Fix long metadata values in the element details dialog not being truncated with an ellipsis, and show the full value in a tooltip on hover without the tooltip being hidden behind the backdrop or clipped by the dialog. This also keeps long descriptions from being clipped at the edge of the dialog when the element has a long metadata value. Fixes [#3279](https://github.com/likec4/likec4/issues/3279)

- [#3280](https://github.com/likec4/likec4/pull/3280) [`78dc808`](https://github.com/likec4/likec4/commit/78dc808186faf9f0b3324894df0c43d248e484e5) Thanks [@cry999](https://github.com/cry999)! - Fix tooltips in the element details dialog (title, "Open source" and "Open default view" buttons) being rendered behind the dialog backdrop. Fixes [#3256](https://github.com/likec4/likec4/issues/3256)

- [#3344](https://github.com/likec4/likec4/pull/3344) [`63b9094`](https://github.com/likec4/likec4/commit/63b909428e5b5288bfb5d0d5eba64b08f45ed5c4) Thanks [@andrewwbuilds](https://github.com/andrewwbuilds)! - Fix the caret jumping to the end of the search input (Ctrl+K) on arrow keys, Backspace and clicks, which made it impossible to edit the middle of the query or delete a selection. Fixes [#3298](https://github.com/likec4/likec4/issues/3298)

- [#3289](https://github.com/likec4/likec4/pull/3289) [`2bf291e`](https://github.com/likec4/likec4/commit/2bf291e6deec01c679e62c881a394eb9a53c51cd) Thanks [@AndersHogqvist](https://github.com/AndersHogqvist)! - Add `sizing` style property for elements. With `sizing fixed`, all elements of the same `size` are drawn with exactly the same width and height, regardless of title, description, icon or shape. Long titles and icons shrink to fit the element instead of making it grow. The default `sizing auto` keeps the current behavior, where `size` is the minimum size.
  
  ```likec4
  specification {
    element service {
      style {
        size small
        sizing fixed
      }
    }
  }
  ```

- [#3278](https://github.com/likec4/likec4/pull/3278) [`3e1abd7`](https://github.com/likec4/likec4/commit/3e1abd7365dfc2d2fa749415fbef64580ef71c75) Thanks [@alexhelkar](https://github.com/alexhelkar)! - Add orthogonal edge routing to draw relationships with horizontal and vertical segments. Set `routing ortho` in a view, append `ortho` to `autoLayout`, or set `styles.defaults.view.routing` in the project configuration. The default remains `spline`. Changing routing preserves saved node positions and connection control points.
  
  Place automatic labels beside long straight segments, avoiding nodes, other labels, and relationship lines where space permits. Labels update after layout and node moves. Manually positioned labels retain their position or offset during editing.
  
  Separate shared segments of edited orthogonal edges into tracks with a target spacing of 12 diagram units. Track shifts also separate connection points along node borders, subject to the space available at each endpoint.
  
  Keep edited edge labels centered under spline routing, preventing the initial jump by half the label's size.
  
  Keep labels and separated tracks aligned with edited edges when connection handles are offset from node centers.
- Updated dependencies [[`3e1abd7`](https://github.com/likec4/likec4/commit/3e1abd7365dfc2d2fa749415fbef64580ef71c75), [`1c22fb0`](https://github.com/likec4/likec4/commit/1c22fb0bc42d9a0c7a9411efba39546aeeb55437), [`a25fcfa`](https://github.com/likec4/likec4/commit/a25fcfae8e47f3c5c3189b3e534a9c9be4a6aead), [`feb3f4e`](https://github.com/likec4/likec4/commit/feb3f4e4cacb9f456161145f97aeed7143160599), [`1332900`](https://github.com/likec4/likec4/commit/1332900ecc79a10aaa81c5aef2334c6a018974dc), [`2bf291e`](https://github.com/likec4/likec4/commit/2bf291e6deec01c679e62c881a394eb9a53c51cd), [`3e1abd7`](https://github.com/likec4/likec4/commit/3e1abd7365dfc2d2fa749415fbef64580ef71c75)]:
  - @likec4/core@1.60.0
  - @likec4/styles@1.60.0

## 1.59.4

### Patch Changes

- [`f0f3ec6`](https://github.com/likec4/likec4/commit/f0f3ec65212ff0bd0e7d2849d11bebeeeb070c90) Thanks [@davydkov](https://github.com/davydkov)! - Add `minZoom` and `maxZoom` props to control the zoom range of embedded diagrams, and render the view on the first paint instead of starting from an empty canvas.

- [#3252](https://github.com/likec4/likec4/pull/3252) [`cd0d5c9`](https://github.com/likec4/likec4/commit/cd0d5c957db59dfc1b5a10c5c682695f7bf4617d) Thanks [@ckeller42](https://github.com/ckeller42)! - Honor the render-view `fitView` option without hiding navigation controls.

- [#3249](https://github.com/likec4/likec4/pull/3249) [`dd113dd`](https://github.com/likec4/likec4/commit/dd113dd0c7840de1837b568ffae8c1b5e6a5121b) Thanks [@ckeller42](https://github.com/ckeller42)! - Let embedded diagrams start centered at a caller-defined zoom.

- [`e956380`](https://github.com/likec4/likec4/commit/e9563807a92d02a7c361d6072e36d6b5da82f3a7) Thanks [@davydkov](https://github.com/davydkov)! - Redesigned the sequence walkthrough outline. The current step is lifted onto its own card with a larger label, the participants it connects, and its notes rendered inline instead of as a collapsing block. Nested fragments now read as depth: the `loop` / `par` / `alt` / `try` you are standing inside is framed and tinted in the same colour the canvas draws that frame with, levels above it step back in contrast, saturation and surface tone, and levels below it show as an indent and a hairline in their own colour. The recession flattens again as the walkthrough leaves a branch. A breadcrumb above the list names the fragments the current step is nested in, and the header shows the step position with a progress meter.

- [`1e34c19`](https://github.com/likec4/likec4/commit/1e34c19483ec1d21f40c9cc57ce57482fb7f1961) Thanks [@davydkov](https://github.com/davydkov)! - Breadcrumb segments in the sequence outline are now clickable — each one jumps the walkthrough to the first step of that fragment, so you can step back out to the top of an enclosing `alt`, `try` or `loop` in one click.

- [#3218](https://github.com/likec4/likec4/pull/3218) [`4b59d64`](https://github.com/likec4/likec4/commit/4b59d6464a2ff347ffc6380037f5c5899a38b5de) Thanks [@ckeller42](https://github.com/ckeller42)! - Configure the default relationship-browser scope and share links that preserve the selected scope.

- [`a091122`](https://github.com/likec4/likec4/commit/a091122b86bb6f9d1f209a7018a221764c0fa916) Thanks [@davydkov](https://github.com/davydkov)! - The sequence outline now animates between steps. The active step card, its number badge, and the frame around the current fragment each travel to their new position instead of disappearing and reappearing, so walking into or out of a branch reads as one continuous move. Motion is skipped under reduced motion and while panning.
- Updated dependencies [[`4e6ee7a`](https://github.com/likec4/likec4/commit/4e6ee7afc526f3dcacd2b5fb03c9d669c3b78cad), [`add966b`](https://github.com/likec4/likec4/commit/add966b37a0df38e57b84181c3d67f973c099dd2), [`f0f3ec6`](https://github.com/likec4/likec4/commit/f0f3ec65212ff0bd0e7d2849d11bebeeeb070c90)]:
  - @likec4/core@1.59.4
  - @likec4/styles@1.59.4

## 1.59.3

### Patch Changes

- [#3166](https://github.com/likec4/likec4/pull/3166) [`67b696e`](https://github.com/likec4/likec4/commit/67b696e77ef8f97f43e435819a019ff8cc637cec) Thanks [@Phrogz](https://github.com/Phrogz)! - Allow embedded editors to skip waiting for a refreshed view after applying a change locally.

- [#3190](https://github.com/likec4/likec4/pull/3190) [`a77d799`](https://github.com/likec4/likec4/commit/a77d79990089149eb0c4420224ee4368041663fd) Thanks [@Phrogz](https://github.com/Phrogz)! - Expose the built-in manual-layout comparison state and actions to custom viewers.

- [#3164](https://github.com/likec4/likec4/pull/3164) [`ef28a22`](https://github.com/likec4/likec4/commit/ef28a2272630324c38fd2465d2a52696160cb59c) Thanks [@Phrogz](https://github.com/Phrogz)! - Restore node dragging and selection when the editor finishes synchronizing a layout change.

- [#3155](https://github.com/likec4/likec4/pull/3155) [`ecae4b2`](https://github.com/likec4/likec4/commit/ecae4b28259040be97f17041ebcf6ce535fc5fe4) Thanks [@ckeller42](https://github.com/ckeller42)! - Render custom SVG icons reliably in relationship views and allow local SVG icons that use `currentColor` to follow `iconColor`.

- [#3200](https://github.com/likec4/likec4/pull/3200) [`13daa47`](https://github.com/likec4/likec4/commit/13daa47058023ee3b13e660dbeb3df97748b09f0) Thanks [@wataryooou](https://github.com/wataryooou)! - Fix crash when clicking another step during a walkthrough in a `diagram`-variant dynamic view. The click handler asserted the ReactFlow edge type, which is `seq-step` only in the `sequence` variant, and now checks the step id instead. Fixes [#3201](https://github.com/likec4/likec4/issues/3201).

- [#3196](https://github.com/likec4/likec4/pull/3196) [`260ac73`](https://github.com/likec4/likec4/commit/260ac730bdfdeb5a27d4a23497b14ad3e2670de6) Thanks [@ekisu](https://github.com/ekisu)! - Syntax highlight language-tagged Markdown code blocks and combined `diff-<language>` blocks in diagram descriptions and notes.

- [#3176](https://github.com/likec4/likec4/pull/3176) [`2159ad5`](https://github.com/likec4/likec4/commit/2159ad568c6daf555f90d6697fc13bf22150530c) Thanks [@Phrogz](https://github.com/Phrogz)! - Hide the manual layout tools tooltip while its popover is open.

- [#3154](https://github.com/likec4/likec4/pull/3154) [`6546da5`](https://github.com/likec4/likec4/commit/6546da5b8f5e96ee2d73d6254e5fa8d8c0a63ec4) Thanks [@ckeller42](https://github.com/ckeller42)! - Preserve original colors for non-Bootstrap diagram icons, including bundled brand, cloud provider, and image-based icons. Fixes [#3153](https://github.com/likec4/likec4/issues/3153).

- [#3187](https://github.com/likec4/likec4/pull/3187) [`be42269`](https://github.com/likec4/likec4/commit/be422697cab02c760f470d5e74c2b709505f72ac) Thanks [@Phrogz](https://github.com/Phrogz)! - Keep automatically routed relationships automatic when moving connected nodes in the layout editor. Fixes [#3184](https://github.com/likec4/likec4/issues/3184).
- Updated dependencies [[`0888635`](https://github.com/likec4/likec4/commit/0888635f3269978599d0fd724529f876332b362c), [`39dc9cf`](https://github.com/likec4/likec4/commit/39dc9cfc729d2e92d9dd0bb4553ed5abca0a3e5d), [`dc7eba2`](https://github.com/likec4/likec4/commit/dc7eba24559706f2e41ee5f8bfd66e79363de435), [`260ac73`](https://github.com/likec4/likec4/commit/260ac730bdfdeb5a27d4a23497b14ad3e2670de6), [`8a4a690`](https://github.com/likec4/likec4/commit/8a4a6905d5cfd63c1c2e443ea93ad86aba474d5e), [`6546da5`](https://github.com/likec4/likec4/commit/6546da5b8f5e96ee2d73d6254e5fa8d8c0a63ec4)]:
  - @likec4/core@1.59.3
  - @likec4/styles@1.59.3

## 1.59.2

### Patch Changes

- Updated dependencies []:
  - @likec4/core@1.59.2
  - @likec4/styles@1.59.2

## 1.59.1

### Patch Changes

- Updated dependencies []:
  - @likec4/core@1.59.1
  - @likec4/styles@1.59.1

## 1.59.0

### Patch Changes

- [#3084](https://github.com/likec4/likec4/pull/3084) [`76ef007`](https://github.com/likec4/likec4/commit/76ef007fd2fb0c6d52cedcdb3ef048a9f2a624c4) Thanks [@davydkov](https://github.com/davydkov)! - Flow control in dynamic views. Besides `parallel`, steps can now be grouped into flow blocks (each with an optional title):

  - `opt`, `loop` and `break` blocks
  - `alt` with `when` / `else` branches
  - `try` / `catch` / `finally` blocks

  ```likec4
  dynamic view example {
    customer -> app 'opens app'
    alt {
      when 'authorized' {
        app -> api 'requests data'
      }
      else 'not authorized' {
        app -> customer 'shows login'
      }
    }
  }
  ```

  Sequence diagrams render these blocks as nested frames, and actors stay visible when zoomed in (fixes [#3074](https://github.com/likec4/likec4/issues/3074)). During a walkthrough, a docked Sequence Outline panel shows the flow as a collapsible tree that mirrors the block nesting — each step is numbered and every operator carries a colored type tag and step count, so you can jump to any step and keep your place.

  > [!NOTE]
  > Flow control blocks are experimental — syntax and rendering may change. We are looking for your feedback in [discussions](https://github.com/likec4/likec4/discussions)!

  Resolved issues:

  - [#2745](https://github.com/likec4/likec4/issues/2745)
  - [#2993](https://github.com/likec4/likec4/issues/2993)
  - [#3074](https://github.com/likec4/likec4/issues/3074)

- [#2990](https://github.com/likec4/likec4/pull/2990) [`fe33144`](https://github.com/likec4/likec4/commit/fe33144ee9e055371150b70a3db093d22a240626) Thanks [@ckeller42](https://github.com/ckeller42)! - Fixes [#2988](https://github.com/likec4/likec4/issues/2988): diagrams now expose LikeC4 node and relationship text to assistive technologies and allow focused nodes and relationships to be activated from the keyboard.

- [#3056](https://github.com/likec4/likec4/pull/3056) [`31e3671`](https://github.com/likec4/likec4/commit/31e3671c2d94d6f5f057c806868865c660eac23f) Thanks [@ckeller42](https://github.com/ckeller42)! - Add keyboard zoom shortcuts for focused diagrams and make zoomable diagrams keyboard-focusable.

  Fixes [#2915](https://github.com/likec4/likec4/issues/2915)

- [#3060](https://github.com/likec4/likec4/pull/3060) [`c830215`](https://github.com/likec4/likec4/commit/c83021565c2fced17d544177f7acfa52e08451f9) Thanks [@farhan523](https://github.com/farhan523)! - Navigation panel: show the full view description in a tooltip on hover.

  View descriptions in the navigation menu are truncated to fit the item, so long descriptions were not fully readable without opening the view. Hovering a view now reveals its complete description in a tooltip.

  Closes [#2933](https://github.com/likec4/likec4/issues/2933)

- Updated dependencies [[`76ef007`](https://github.com/likec4/likec4/commit/76ef007fd2fb0c6d52cedcdb3ef048a9f2a624c4), [`0994577`](https://github.com/likec4/likec4/commit/09945775fb0c4c64b79eae6f17ee0abce92ef8f1), [`9b9727f`](https://github.com/likec4/likec4/commit/9b9727fcd1201296c4d7e09f7446edd38669328a), [`d0a05fe`](https://github.com/likec4/likec4/commit/d0a05fe8e29105444762542c78c9861a13bfaff0), [`1814846`](https://github.com/likec4/likec4/commit/1814846f629971cec2a392222ab00c42abea47ed), [`061e687`](https://github.com/likec4/likec4/commit/061e6872ee80b1381d3ec047663a22d1ebe6bab5)]:
  - @likec4/core@1.59.0
  - @likec4/styles@1.59.0

## 1.57.1

### Patch Changes

- [`f2c0b57`](https://github.com/likec4/likec4/commit/f2c0b57485e912e85a986d5f89408a6039538ecc) Thanks [@davydkov](https://github.com/davydkov)! - Support deleting elements/edges in the diagram editor (except dynamic views). Selecting nodes (and/or edges) and pressing delete now removes them from the view, automatically dropping any edges connected to a deleted node. The change is added to undo/redo history.

- [`f2c0b57`](https://github.com/likec4/likec4/commit/f2c0b57485e912e85a986d5f89408a6039538ecc) Thanks [@davydkov](https://github.com/davydkov)! - Edit edge label positions in the diagram editor. Select a relationship edge and drag its label to reposition it; the position is saved to the manual layout with undo/redo. A manually placed label moves together with the edge when its curve is reshaped, keeping its offset.

- [#2995](https://github.com/likec4/likec4/pull/2995) [`e14bc24`](https://github.com/likec4/likec4/commit/e14bc24f4337de29c35fac6f7532fc99dd2904ad) Thanks [@davydkov](https://github.com/davydkov)! - fix: "apply latest" action tries to run the new AI layout enhancement

- [#2978](https://github.com/likec4/likec4/pull/2978) [`75e1510`](https://github.com/likec4/likec4/commit/75e1510def804bf9931bf222b03d1034e1181d04) Thanks [@farhan523](https://github.com/farhan523)! - Tags with custom hex / rgb colors now get an accurate text color derived from the background via APCA contrast, instead of the previous CSS-filter workaround. `TagStylesProvider` emits `--colors-likec4-tag-text` for all tags (custom-colored and named), and the `autoTextColor` variant is removed from the `likec4tag` recipe. `getContrastedColorsAPCA` is now exported from `@likec4/core/styles`. Resolves [#2143](https://github.com/likec4/likec4/issues/2143).

- Updated dependencies [[`f2c0b57`](https://github.com/likec4/likec4/commit/f2c0b57485e912e85a986d5f89408a6039538ecc), [`8ad28c7`](https://github.com/likec4/likec4/commit/8ad28c777c76f294483c352180c7e3ea037eddfd), [`75e1510`](https://github.com/likec4/likec4/commit/75e1510def804bf9931bf222b03d1034e1181d04)]:
  - @likec4/core@1.57.1
  - @likec4/styles@1.57.1

## 1.57.0

### Patch Changes

- [#2967](https://github.com/likec4/likec4/pull/2967) [`c46e33e`](https://github.com/likec4/likec4/commit/c46e33e493cd2dd2079246a276e22bd2d6d775e9) Thanks [@ckeller42](https://github.com/ckeller42)! - Fix expanded embedded LikeC4 views rendering with a transparent overlay background.

  Fixes [#2965](https://github.com/likec4/likec4/issues/2965).

- [#2976](https://github.com/likec4/likec4/pull/2976) [`783155b`](https://github.com/likec4/likec4/commit/783155bba49ec60485af2c7f420fbb28e893955c) Thanks [@davydkov](https://github.com/davydkov)! - Fix overlay animations (relationships browser, element details, search) glitching on open/close.

- Updated dependencies [[`311b93d`](https://github.com/likec4/likec4/commit/311b93de360556b9583b901c5ad3d6692b9c9f03), [`35ba3f6`](https://github.com/likec4/likec4/commit/35ba3f637e45fc1072646f646b3442b3235cc29d)]:
  - @likec4/core@1.57.0
  - @likec4/styles@1.57.0

## 1.56.0

### Patch Changes

- [#2921](https://github.com/likec4/likec4/pull/2921) [`5f46082`](https://github.com/likec4/likec4/commit/5f460821526d851ef3bbf8be5a2bd749c2df6a8a) Thanks [@davydkov](https://github.com/davydkov)! - Update Mantine to 9.1.0. The `light` variant of Buttons, Alerts, and ActionIcons now uses solid colors instead of transparency.

- Updated dependencies [[`ace5b2e`](https://github.com/likec4/likec4/commit/ace5b2e5cd261f47bd2e93b6f495e2122ceef16d), [`5f46082`](https://github.com/likec4/likec4/commit/5f460821526d851ef3bbf8be5a2bd749c2df6a8a)]:
  - @likec4/core@1.56.0
  - @likec4/styles@1.56.0

## 1.55.1

### Patch Changes

- [#2894](https://github.com/likec4/likec4/pull/2894) [`0b8825b`](https://github.com/likec4/likec4/commit/0b8825b8c4053a7908d0ba96145687824e2bc597) Thanks [@ckeller42](https://github.com/ckeller42)! - Fix text overflow in relationship popover and element details card when displaying long element names, relationship titles, and technology strings

- [#2875](https://github.com/likec4/likec4/pull/2875) [`36d5627`](https://github.com/likec4/likec4/commit/36d5627ccadda9d80488eaf7695cdde25b61d7df) Thanks [@ckeller42](https://github.com/ckeller42)! - Fix search overlay persisting after navigating to a view via Ctrl+K search

- Updated dependencies [[`b5e33d1`](https://github.com/likec4/likec4/commit/b5e33d12c548e34f820e565182b0b057505c2f64)]:
  - @likec4/styles@1.55.1
  - @likec4/core@1.55.1

## 1.55.0

### Patch Changes

- Updated dependencies [[`6b87578`](https://github.com/likec4/likec4/commit/6b87578486c821fdc1060d69867a10f3c7e6ca9b), [`f684e2f`](https://github.com/likec4/likec4/commit/f684e2fb59745fe62ac2b43c68f1e453ab884cc8), [`347b48f`](https://github.com/likec4/likec4/commit/347b48f7bb67e0a480e231d57c4feeca09b32383), [`9834ebb`](https://github.com/likec4/likec4/commit/9834ebbfa32bdcb40710aac9038839e9da70031e), [`c0048b6`](https://github.com/likec4/likec4/commit/c0048b6ca156508c893e072dfbf9d75bbe4dd8ad)]:
  - @likec4/core@1.55.0
  - @likec4/styles@1.55.0

## 1.54.0

### Patch Changes

- [#2827](https://github.com/likec4/likec4/pull/2827) [`1ae3eb6`](https://github.com/likec4/likec4/commit/1ae3eb6b19a9736f683a8b50c2c883eeb4204885) Thanks [@kavishkartha05](https://github.com/kavishkartha05)! - Fix dynamic view variant setting not being honored when navigating to a dynamic view
  Fixes [#2802](https://github.com/likec4/likec4/issues/2802)

- [#2791](https://github.com/likec4/likec4/pull/2791) [`6d6cdd2`](https://github.com/likec4/likec4/commit/6d6cdd2857f6e804a40c3963f6a4841dfa13bd6c) Thanks [@davydkov](https://github.com/davydkov)! - Fix manual layout alignment tools (Align Left, Right, Center, Top, Middle, Bottom) not working

  Fixes [#2771](https://github.com/likec4/likec4/issues/2771)

- Updated dependencies []:
  - @likec4/core@1.54.0
  - @likec4/styles@1.54.0

## 1.53.0

### Patch Changes

- [#2785](https://github.com/likec4/likec4/pull/2785) [`eddfe46`](https://github.com/likec4/likec4/commit/eddfe462b49d8dd598db443259bc2ba0820b76f1) Thanks [@davydkov](https://github.com/davydkov)! - Fix drag behavior for group nodes

- [#2784](https://github.com/likec4/likec4/pull/2784) [`16386c5`](https://github.com/likec4/likec4/commit/16386c52e0285e6b8a5c859dc45726a7cb1869d4) Thanks [@davydkov](https://github.com/davydkov)! - Fix scroll in walkthrough notes panel. Fixes [#2729](https://github.com/likec4/likec4/issues/2729)

- Updated dependencies [[`39df42e`](https://github.com/likec4/likec4/commit/39df42e69d11a74cfbda94258321860d9437a3f7)]:
  - @likec4/core@1.53.0
  - @likec4/styles@1.53.0

## 1.52.0

### Patch Changes

- [#2665](https://github.com/likec4/likec4/pull/2665) [`6257147`](https://github.com/likec4/likec4/commit/6257147265d69972b4b4f2dc472d0b58a03bc607) Thanks [@ckeller42](https://github.com/ckeller42)! - Add search bar, navigation drawer, and theme toggle to overview page

  - Search for elements and views directly from the overview page via visible search bar or ⌘K
  - Browse all diagrams through sidebar navigation drawer with file/folder/list grouping
  - Toggle dark/light mode from the overview header
  - Navigate from search results to a diagram view with element focus

  Fixes [#1679](https://github.com/likec4/likec4/issues/1679)

- Updated dependencies [[`bc47423`](https://github.com/likec4/likec4/commit/bc474235cf31a7d42e8c4f25328a698bb7edefe3)]:
  - @likec4/core@1.52.0
  - @likec4/styles@1.52.0

## 1.51.0

### Patch Changes

- Updated dependencies [[`41ff551`](https://github.com/likec4/likec4/commit/41ff551974838696fdf4adfcd92edc30afd245c5)]:
  - @likec4/styles@1.51.0
  - @likec4/core@1.51.0

## 1.50.0

### Patch Changes

- [#2656](https://github.com/likec4/likec4/pull/2656) [`7f43ca1`](https://github.com/likec4/likec4/commit/7f43ca19d90f4db0b02c44a72c7eae66dfc76942) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Fix O-version edge markers (odiamond, oarrow, odot) to display as hollow with background fill instead of solid fill

  Fixes [#2634](https://github.com/likec4/likec4/issues/2634)

- Updated dependencies [[`fe468d8`](https://github.com/likec4/likec4/commit/fe468d830544e6f0051ea2203ab137d46932d11e)]:
  - @likec4/core@1.50.0
  - @likec4/styles@1.50.0

## 1.49.0

### Minor Changes

- [#2620](https://github.com/likec4/likec4/pull/2620) [`9e7807b`](https://github.com/likec4/likec4/commit/9e7807b5157a355d23b9f3a2ddff7a10bb1d01a1) Thanks [@davydkov](https://github.com/davydkov)! - Do not build diagram bundle, as components are now exported directly from the package.

### Patch Changes

- [#2616](https://github.com/likec4/likec4/pull/2616) [`4a7c01c`](https://github.com/likec4/likec4/commit/4a7c01c9ee1e2d006f9002b0fed79cb5fdda9a6f) Thanks [@davydkov](https://github.com/davydkov)! - Add new `component` element shape

- [`ceeb0c7`](https://github.com/likec4/likec4/commit/ceeb0c711f99bbd3de63a0ed5c43574c7bde7120) Thanks [@davydkov](https://github.com/davydkov)! - Clean up drifts display

- [`f42c046`](https://github.com/likec4/likec4/commit/f42c046cd4bf1a3f4037cb2020268e729f018300) Thanks [@davydkov](https://github.com/davydkov)! - First iteration of element notes feature to diagrams

  - Add notes property to NodeModel for element annotations
  - Add enableNotes prop to diagram components for controlling notes display
  - Implement visual notes indicator with paper-like styling
  - Support notes in all node types (elements, deployment, sequence actors)
  - Add hover effects and animations for notes indicators

- [`e10ea04`](https://github.com/likec4/likec4/commit/e10ea04bd2119b83cbd4c625640e63cd6e3f2e96) Thanks [@davydkov](https://github.com/davydkov)! - Fix compound nodes not respecting border style from defaults
  Closes [#2501](https://github.com/like-c4/like-c4/issues/2501)

- [#2591](https://github.com/likec4/likec4/pull/2591) [`c05757e`](https://github.com/likec4/likec4/commit/c05757e94fbb791750c897b152b9b631f7ce906c) Thanks [@kaigritun](https://github.com/kaigritun)! - Fix iconColor for custom SVG icons from data URLs by inlining SVG content to enable CSS color inheritance via currentColor

- [`e10ea04`](https://github.com/likec4/likec4/commit/e10ea04bd2119b83cbd4c625640e63cd6e3f2e96) Thanks [@davydkov](https://github.com/davydkov)! - Set fixed icon sizes for consistent rendering

- [`fa87d71`](https://github.com/likec4/likec4/commit/fa87d7138b5c17e5fec037eb408fb9abf4cb6799) Thanks [@davydkov](https://github.com/davydkov)! - Improve compare panel:

  - Add reset manual layout button with tooltip guidance
  - Improve processing state handling with better animation timing
  - Add tooltips for better user guidance on layout restrictions

- [`f42c046`](https://github.com/likec4/likec4/commit/f42c046cd4bf1a3f4037cb2020268e729f018300) Thanks [@davydkov](https://github.com/davydkov)! - Add review drifts feature to the compare panel, highlight drifts in the diagram and add drifts summary panel.

- Updated dependencies [[`f42c046`](https://github.com/likec4/likec4/commit/f42c046cd4bf1a3f4037cb2020268e729f018300), [`507bab3`](https://github.com/likec4/likec4/commit/507bab30cf9e30450cedfc4b27f67718a387b2e7), [`e10ea04`](https://github.com/likec4/likec4/commit/e10ea04bd2119b83cbd4c625640e63cd6e3f2e96), [`e10ea04`](https://github.com/likec4/likec4/commit/e10ea04bd2119b83cbd4c625640e63cd6e3f2e96), [`731a6cb`](https://github.com/likec4/likec4/commit/731a6cb278ef6bc06280bf1ba3b2d8f79c7d7fe6)]:
  - @likec4/core@1.49.0
  - @likec4/styles@1.49.0

## 1.48.0

### Minor Changes

- [`68c6bf2`](https://github.com/likec4/likec4/commit/68c6bf286536e39ec316db906a425e2bfc852a83) Thanks [@davydkov](https://github.com/davydkov)! - Add icon customization options

  - Add iconColor, iconSize, and iconPosition properties to element styles
  - Support icon positioning (left, right, top, bottom) in diagrams and layouts
  - Enable custom icon colors and sizes in element specifications

- [`cd71c00`](https://github.com/likec4/likec4/commit/cd71c00a36cfe3a065a578befe87f6b1d2d26a6d) Thanks [@ckeller42](https://github.com/ckeller42)! - Direct links to Relationship Views, thanks to @ckeller42 in [#2547](https://github.com/ckeller/likec4/pull/2547)

### Patch Changes

- [`c333592`](https://github.com/likec4/likec4/commit/c333592b6342dc4a726864e970c8056bc65fafa8) Thanks [@davydkov](https://github.com/davydkov)! - Fix compound node colors (based on element color and depth)

- [`9aa59c8`](https://github.com/likec4/likec4/commit/9aa59c81f40ac948b32842a265bfdfe48d21bddf) Thanks [@davydkov](https://github.com/davydkov)! - Improved color contrast and visual appearance for compound nodes (nested elements)

- [`6ab5089`](https://github.com/likec4/likec4/commit/6ab5089fc2c1ce472fa5f5a471061056676e5546) Thanks [@davydkov](https://github.com/davydkov)! - Improved font loading performance by migrating to variable fonts and enhanced diagram bounds calculation with better edge handling

- [`e9d70f0`](https://github.com/likec4/likec4/commit/e9d70f0e70c0df8ffa92accea156ecc4c8c20f35) Thanks [@davydkov](https://github.com/davydkov)! - Fix regression with centering dynamic views on switching between `diagram`/`sequence`

- Updated dependencies [[`c333592`](https://github.com/likec4/likec4/commit/c333592b6342dc4a726864e970c8056bc65fafa8), [`68c6bf2`](https://github.com/likec4/likec4/commit/68c6bf286536e39ec316db906a425e2bfc852a83), [`9aa59c8`](https://github.com/likec4/likec4/commit/9aa59c81f40ac948b32842a265bfdfe48d21bddf), [`3049b78`](https://github.com/likec4/likec4/commit/3049b78701df485fff6fae2f0ac9ee08873872c2), [`c186a08`](https://github.com/likec4/likec4/commit/c186a082c6fbb26d2b5169a9c28ca51e540622f6), [`6677d12`](https://github.com/likec4/likec4/commit/6677d124aaf6c45fb1456ce66a5c538634fe5fa0), [`c12f7a1`](https://github.com/likec4/likec4/commit/c12f7a108c19418403f5afc0c06c1e25565f6bf2), [`6ab5089`](https://github.com/likec4/likec4/commit/6ab5089fc2c1ce472fa5f5a471061056676e5546)]:
  - @likec4/core@1.48.0
  - @likec4/styles@1.48.0

## 1.47.0

### Patch Changes

- [#2520](https://github.com/likec4/likec4/pull/2520) [`0112f3d`](https://github.com/likec4/likec4/commit/0112f3deb18d065ce1d97872095b8496cf2dfc97) Thanks [@davydkov](https://github.com/davydkov)! - - Change in LikeC4View React: callback `onBurgerMenuClick` renamed to `onLogoClick`

- [#2521](https://github.com/likec4/likec4/pull/2521) [`de2b294`](https://github.com/likec4/likec4/commit/de2b2942322f1a1b0ce4822e40c997ba3fff9e15) Thanks [@davydkov](https://github.com/davydkov)! - - Add two new shapes: `document` and `bucket`
  - Apply border style to element node (previously it was applied to compound nodes and groups), closes [#2502](https://github.com/likec4/likec4/issues/2502)
- Updated dependencies [[`dbaae67`](https://github.com/likec4/likec4/commit/dbaae67a2f00b6cacf1a0391cd8132b1d5f0e2ee), [`de2b294`](https://github.com/likec4/likec4/commit/de2b2942322f1a1b0ce4822e40c997ba3fff9e15), [`5e38c9b`](https://github.com/likec4/likec4/commit/5e38c9b2fced5fc43aee0326204a443d889a9d37)]:
  - @likec4/core@1.47.0
  - @likec4/styles@1.47.0

## 1.46.4

### Patch Changes

- Updated dependencies []:
  - @likec4/core@1.46.4
  - @likec4/styles@1.46.4

## 1.46.3

### Patch Changes

- Updated dependencies []:
  - @likec4/styles@1.46.3
  - @likec4/core@1.46.3

## 1.46.2

### Patch Changes

- Fixed transparent background of the properties window ([#2473](https://github.com/likec4/likec4/issues/2473))
- Updated dependencies [[`9c5779d`](https://github.com/likec4/likec4/commit/9c5779d872d8de353adf706d1a0edbbcd8bb9671)]:
  - @likec4/core@1.46.2
