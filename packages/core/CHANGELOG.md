# @likec4/core

## 1.56.0

### Minor Changes

- [#2912](https://github.com/likec4/likec4/pull/2912) [`ace5b2e`](https://github.com/likec4/likec4/commit/ace5b2e5cd261f47bd2e93b6f495e2122ceef16d) Thanks [@Kiiv](https://github.com/Kiiv)! - Improve color palette used for element rendering to be more accurate with the color specified by the user. Fix https://github.com/likec4/likec4/issues/2101

### Patch Changes

- [#2921](https://github.com/likec4/likec4/pull/2921) [`5f46082`](https://github.com/likec4/likec4/commit/5f460821526d851ef3bbf8be5a2bd749c2df6a8a) Thanks [@davydkov](https://github.com/davydkov)! - Update Mantine to 9.1.0. The `light` variant of Buttons, Alerts, and ActionIcons now uses solid colors instead of transparency.

## 1.55.1

## 1.55.0

### Patch Changes

- [#2864](https://github.com/likec4/likec4/pull/2864) [`6b87578`](https://github.com/likec4/likec4/commit/6b87578486c821fdc1060d69867a10f3c7e6ca9b) Thanks [@davydkov](https://github.com/davydkov)! - Inherit relationship styles (color, line, head, tail) from specification in dynamic views

  Fixes [#2797](https://github.com/likec4/likec4/issues/2797)

- [#2860](https://github.com/likec4/likec4/pull/2860) [`f684e2f`](https://github.com/likec4/likec4/commit/f684e2fb59745fe62ac2b43c68f1e453ab884cc8) Thanks [@davydkov](https://github.com/davydkov)! - Fix custom element `description` and `summary` being overwritten by specification defaults in Builder API

  Fixes [#2795](https://github.com/likec4/likec4/issues/2795)

- [#2883](https://github.com/likec4/likec4/pull/2883) [`347b48f`](https://github.com/likec4/likec4/commit/347b48f7bb67e0a480e231d57c4feeca09b32383) Thanks [@ckeller42](https://github.com/ckeller42)! - Fix crash on views with manual layout in dev mode (applyManualLayout invariant)

- [#2881](https://github.com/likec4/likec4/pull/2881) [`9834ebb`](https://github.com/likec4/likec4/commit/9834ebbfa32bdcb40710aac9038839e9da70031e) Thanks [@ckeller42](https://github.com/ckeller42)! - Allow data: URIs in markdown image src (rehype-sanitize protocols)

- [#2858](https://github.com/likec4/likec4/pull/2858) [`c0048b6`](https://github.com/likec4/likec4/commit/c0048b6ca156508c893e072dfbf9d75bbe4dd8ad) Thanks [@davydkov](https://github.com/davydkov)! - Fix predicate evaluation for wildcard expressions with `where`.
  Previously, `include * where` was applying filter to the root elements (or children inside scoped view).
  Now it applies the filter to all elements, to match the wildcard semantics.

  Fixes [#2837](https://github.com/likec4/likec4/issues/2837)

## 1.54.0

## 1.53.0

### Minor Changes

- [#2769](https://github.com/likec4/likec4/pull/2769) [`39df42e`](https://github.com/likec4/likec4/commit/39df42e69d11a74cfbda94258321860d9437a3f7) Thanks [@galuszkak](https://github.com/galuszkak)! - Support `metadata` filtering in view predicates

  - Filter elements and relations by metadata key existence (`where metadata.key`) or value (`where metadata.key = 'value'`)
  - Works with `!=` for negation and supports `source.metadata` / `target.metadata` for relation participants

## 1.52.0

### Patch Changes

- [#2713](https://github.com/likec4/likec4/pull/2713) [`bc47423`](https://github.com/likec4/likec4/commit/bc474235cf31a7d42e8c4f25328a698bb7edefe3) Thanks [@davydkov](https://github.com/davydkov)! - Remove deprecated ManualLayoutV1 and related migration command

## 1.51.0

## 1.50.0

### Patch Changes

- [#2642](https://github.com/likec4/likec4/pull/2642) [`fe468d8`](https://github.com/likec4/likec4/commit/fe468d830544e6f0051ea2203ab137d46932d11e) Thanks [@davydkov](https://github.com/davydkov)! - Automatically derive element technology from icon name when not set explicitly.
  Elements with `aws:`, `azure:`, `gcp:`, or `tech:` icons will get a human-readable technology label
  (e.g. `tech:apache-flink` → "Apache Flink"). Can be disabled via `inferTechnologyFromIcon: false` in project config.

## 1.49.0

### Patch Changes

- [`f42c046`](https://github.com/likec4/likec4/commit/f42c046cd4bf1a3f4037cb2020268e729f018300) Thanks [@davydkov](https://github.com/davydkov)! - First iteration of element notes feature to diagrams

  - Add notes property to NodeModel for element annotations
  - Add enableNotes prop to diagram components for controlling notes display
  - Implement visual notes indicator with paper-like styling
  - Support notes in all node types (elements, deployment, sequence actors)
  - Add hover effects and animations for notes indicators

- [#2624](https://github.com/likec4/likec4/pull/2624) [`507bab3`](https://github.com/likec4/likec4/commit/507bab30cf9e30450cedfc4b27f67718a387b2e7) Thanks [@davydkov](https://github.com/davydkov)! - Enhanced hover tooltips in editor now show relationship counts and clickable links to views containing the element

- [`e10ea04`](https://github.com/likec4/likec4/commit/e10ea04bd2119b83cbd4c625640e63cd6e3f2e96) Thanks [@davydkov](https://github.com/davydkov)! - Fix compound nodes not respecting border style from defaults
  Closes [#2501](https://github.com/like-c4/like-c4/issues/2501)

- [`731a6cb`](https://github.com/likec4/likec4/commit/731a6cb278ef6bc06280bf1ba3b2d8f79c7d7fe6) Thanks [@davydkov](https://github.com/davydkov)! - Add notes to the elements and relationships using `with`. Example:

  ```
  view {
    include
      some.element with {
        notes '''
          This is a note for some.element.
          It can contain multiple lines and **markdown** formatting.
        '''
      }
  }
  ```

  Relates to [#2567](https://github.com/likec4/likec4/issues/2567)

## 1.48.0

### Minor Changes

- [`68c6bf2`](https://github.com/likec4/likec4/commit/68c6bf286536e39ec316db906a425e2bfc852a83) Thanks [@davydkov](https://github.com/davydkov)! - Add icon customization options

  - Add iconColor, iconSize, and iconPosition properties to element styles
  - Support icon positioning (left, right, top, bottom) in diagrams and layouts
  - Enable custom icon colors and sizes in element specifications

- [`c186a08`](https://github.com/likec4/likec4/commit/c186a082c6fbb26d2b5169a9c28ca51e540622f6) Thanks [@davydkov](https://github.com/davydkov)! - Add API to compute Adhoc views (not defined in the model and computed on demand)

### Patch Changes

- [`c333592`](https://github.com/likec4/likec4/commit/c333592b6342dc4a726864e970c8056bc65fafa8) Thanks [@davydkov](https://github.com/davydkov)! - Fix compound node colors (based on element color and depth)

- [`9aa59c8`](https://github.com/likec4/likec4/commit/9aa59c81f40ac948b32842a265bfdfe48d21bddf) Thanks [@davydkov](https://github.com/davydkov)! - Improved color contrast and visual appearance for compound nodes (nested elements)

- [`6677d12`](https://github.com/likec4/likec4/commit/6677d124aaf6c45fb1456ce66a5c538634fe5fa0) Thanks [@davydkov](https://github.com/davydkov)! - Derive technology in RelationshipModel and DeploymentRelationModel from kind specification when not explicitly set

- [#2543](https://github.com/likec4/likec4/pull/2543) [`c12f7a1`](https://github.com/likec4/likec4/commit/c12f7a108c19418403f5afc0c06c1e25565f6bf2) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Dynamic view steps now inherit technology and description from model relationships and specification relationship kinds

- [`6ab5089`](https://github.com/likec4/likec4/commit/6ab5089fc2c1ce472fa5f5a471061056676e5546) Thanks [@davydkov](https://github.com/davydkov)! - Improved font loading performance by migrating to variable fonts and enhanced diagram bounds calculation with better edge handling

## 1.47.0

### Patch Changes

- [#2520](https://github.com/likec4/likec4/pull/2520) [`dbaae67`](https://github.com/likec4/likec4/commit/dbaae67a2f00b6cacf1a0391cd8132b1d5f0e2ee) Thanks [@davydkov](https://github.com/davydkov)! - Add `computeProjectsView`, as an overview of projects and their relationships

- [#2521](https://github.com/likec4/likec4/pull/2521) [`de2b294`](https://github.com/likec4/likec4/commit/de2b2942322f1a1b0ce4822e40c997ba3fff9e15) Thanks [@davydkov](https://github.com/davydkov)! - - Add two new shapes: `document` and `bucket`

  - Apply border style to element node (previously it was applied to compound nodes and groups), closes [#2502](https://github.com/likec4/likec4/issues/2502)

- [#2520](https://github.com/likec4/likec4/pull/2520) [`5e38c9b`](https://github.com/likec4/likec4/commit/5e38c9b2fced5fc43aee0326204a443d889a9d37) Thanks [@davydkov](https://github.com/davydkov)! - Fixed issue with computation of views with groups, that led to missing relations.
  Exclude imported elements from views if have no relationships and not included explicitly

## 1.46.4

## 1.46.3

## 1.46.2

### Patch Changes

- [#2476](https://github.com/likec4/likec4/pull/2476) [`9c5779d`](https://github.com/likec4/likec4/commit/9c5779d872d8de353adf706d1a0edbbcd8bb9671) Thanks [@davydkov](https://github.com/davydkov)! - Deployment nodes name is wrong derived from instanceOf, fixes [#2387](https://github.com/likec4/likec4/issues/2387)
