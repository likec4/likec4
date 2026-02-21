# Agent Instructions: Adding a New Element Shape to LikeC4

You are an agent that adds new element shapes to the LikeC4 codebase. Follow these steps exactly. Each step references the specific file and location where changes are needed.

**Before starting:** Read the root `AGENTS.md` and `packages/language-server/AGENTS.md` for project conventions.

---

## Prerequisites

Run `pnpm install` if `node_modules` is missing.

---

## Step 1: Add shape to the core type array

**File:** `styled-system/preset/src/defaults/types.ts`

Add the new shape name (lowercase string) to the `ElementShapes` array. This array is the single source of truth for the `ElementShape` type union, and is also used by `styled-system/preset/src/conditions.ts` to auto-generate PandaCSS conditions (e.g. `_shapeMyShape`).

```typescript
export const ElementShapes = [
  'rectangle',
  'person',
  // ... existing shapes ...
  'YOUR_SHAPE',  // <-- add here
] as const
```

No other type file needs manual editing. `ElementShape` is derived as `typeof ElementShapes[number]`.

---

## Step 2: Add shape to the Langium grammar

**File:** `packages/language-server/src/like-c4.langium`

Find the `ElementShape returns string:` rule (around line 941) and add the new shape name:

```
ElementShape returns string:
  'rectangle' |
  'YOUR_SHAPE' |   // <-- add here
  'person' |
  ...
  'document';
```

**After this change:** You MUST run `pnpm generate` to regenerate the Langium parser. Do this at the end after all grammar changes, or now if you need to test incrementally.

---

## Step 3: Update TextMate grammars (syntax highlighting)

Three files need identical changes. Find the `"shapes"` pattern (regex matching shape keywords) and add the new shape to the alternation:

1. **`packages/vscode/likec4.tmLanguage.json`** (around line 172)
2. **`apps/playground/likec4.tmLanguage.json`** (around line 173)
3. **`apps/docs/likec4.tmLanguage.json`** (find the shapes pattern)

Change:
```json
"match": "\\b(rectangle|person|browser|mobile|cylinder|storage|queue|bucket|document)\\b"
```
To:
```json
"match": "\\b(rectangle|YOUR_SHAPE|person|browser|mobile|cylinder|storage|queue|bucket|document)\\b"
```

---

## Step 4: Implement the SVG shape rendering

**File:** `packages/diagram/src/base-primitives/element/ElementShape.tsx`

This is the main visual rendering file. You need to modify two switch statements:

### 4a: `ShapeSvg` function (around line 161)

Add a new `case` for your shape. The function receives `{ shape, w, h, size }` where `w`/`h` are the element dimensions and `size` is the responsive size (`'xs' | 'sm' | 'md' | 'lg' | 'xl'`).

Use existing shapes as reference patterns:
- **Simple shapes** (rectangle base + decorations): see `'component'` or `'person'`
- **Custom SVG path shapes**: see `'cylinder'`, `'queue'`, `'bucket'`, `'document'`
- **Box-with-inner-elements shapes**: see `'browser'`, `'mobile'`

Key SVG conventions:
- Main fill uses no `data-likec4-fill` attribute (inherits from parent)
- Use `data-likec4-fill="mix-stroke"` for stroke-fill mix coloring
- Use `data-likec4-fill="fill"` for fill-colored sub-elements
- Use `strokeWidth={0}` for filled shapes, `strokeWidth={2}` for outlined shapes
- For responsive sub-elements, use the `size` parameter with a `switch` statement (see `ComponentTopLeftRect`)

### 4b: `ShapeSvgOutline` function (around line 297)

Add your shape to the selection outline rendering. If your shape has a custom path (non-rectangular), add a specific case:

```typescript
case 'YOUR_SHAPE':
  svg = (
    <g transform="translate(-3 -3)">
      <path d={yourShapeSVGPath(w + 6, h + 6).path} />
    </g>
  )
  break
```

If your shape is rectangular, it will fall through to the `default` case which renders a rounded rect outline. This is fine for shapes like `'component'` and `'person'`.

---

## Step 5: Add icon mapping

**File:** `packages/diagram/src/context/IconRenderer.tsx`

Find the `ShapeIcons` object (around line 141) and add a mapping for the new shape. The icon must be from `@tabler/icons-react`:

```typescript
const ShapeIcons = {
  // ... existing mappings ...
  YOUR_SHAPE: IconSomething,  // <-- add here, import from @tabler/icons-react
} as const satisfies {
  [key in ElementShape]: ForwardRefExoticComponent<IconProps & RefAttributes<SVGSVGElement>>
}
```

Choose an appropriate Tabler icon. If unsure, use `IconRectangularPrism` as a fallback.

---

## Step 6: Add shape-specific padding (if needed)

**File:** `styled-system/preset/src/recipes/elementNodeData.ts`

If your shape has visual elements that overlap the text area (e.g. side decorations like `component`, or top elements like `browser`/`cylinder`), add padding to offset the text content. Find the shape-specific padding section (around line 45-69):

```typescript
_shapeYourShape: {
  paddingLeft: `calc(${__v('spacing')} + 30px)`,  // adjust values as needed
},
```

The condition name `_shapeYourShape` is auto-generated from the `ElementShapes` array via `conditions.ts`. Use camelCase after `_shape` (e.g. `_shapeMyNewShape` for shape `'my-new-shape'`... but shapes are single lowercase words so it would be `_shapeMyshape` for `'myshape'`).

**Skip this step** if your shape doesn't have decorations overlapping the text area.

---

## Step 7: Add shape-specific styling (if needed)

**File:** `styled-system/preset/src/recipes/elementShape.ts`

If your shape has custom sub-elements that need their own CSS (like the `componentTopLeftRect` part), you need to:

### 7a: Add a new part definition (line 4-10):

```typescript
const parts = defineParts({
  root: { selector: '&' },
  outline: { selector: '& .likec4-shape-outline' },
  multipleHtml: { selector: '& .likec4-shape-multiple' },
  yourShapePart: { selector: '& .your-class-name' },  // <-- add if needed
  multipleSvg: { selector: '&:is([data-likec4-shape-multiple="true"])' },
})
```

### 7b: Add styling for the part in the `svg` variant (around line 115-151):

```typescript
yourShapePart: {
  fill: 'color-mix(in oklab, var(--likec4-palette-stroke) 40%, var(--likec4-palette-fill))',
  transition: `all 120ms {easings.in}`,
  // ... hover/selected state transitions
},
```

**Skip this step** if your shape only uses standard SVG elements with `data-likec4-fill` attributes.

---

## Step 8: Add layout engine support

**File:** `packages/layouts/src/graphviz/DotPrinter.ts`

Find the shape switch in the `addNode` method (around line 425-442). Add a case if your shape needs different Graphviz dimensions or margins:

```typescript
case 'YOUR_SHAPE': {
  node.attributes.apply({
    [_.width]: pxToInch(width + 10),   // extra width for decorations
    [_.margin]: `${pxToInch(paddingX + 20)},${pxToInch(padding)}`,  // extra margin
  })
  break
}
```

**Skip this step** if your shape has the same bounding box as a rectangle (no protruding elements).

---

## Step 9: Add export generator mappings

Four generator files need updates. Each maps `ElementShape` to the target format's shape system:

### 9a: DrawIO
**File:** `packages/generators/src/drawio/generate-drawio.ts`

Find the shape switch and add:
```typescript
case 'YOUR_SHAPE':
  return 'shape=rectangle;'  // or DrawIO native shape if one exists
```

### 9b: PlantUML
**File:** `packages/generators/src/puml/generate-puml.ts`

```typescript
case 'YOUR_SHAPE': {
  return 'rectangle' as const  // or PlantUML native shape
}
```

### 9c: Mermaid
**File:** `packages/generators/src/mmd/generate-mmd.ts`

```typescript
case 'YOUR_SHAPE': {
  return `@{ shape: rectangle, ${label} }`  // or Mermaid native shape
}
```

### 9d: D2
**File:** `packages/generators/src/d2/generate-d2.ts`

Add to an existing fallback group or create a new case:
```typescript
case 'YOUR_SHAPE':
  // ... falls through to rectangle or add specific D2 shape
```

---

## Step 10: Update CompletionProvider test

**File:** `packages/language-server/src/lsp/CompletionProvider.spec.ts`

Find the `expectedItems` array for shape completions (around line 86-97) and add your shape. The order should match the Langium grammar:

```typescript
expectedItems: [
  'rectangle',
  'YOUR_SHAPE',   // <-- match grammar order
  'person',
  // ...
],
```

---

## Step 11: Add e2e test usage (optional but recommended)

**File:** `e2e/src/likec4/views.c4`

Add a style rule that uses the new shape:
```
style some_element {
  shape YOUR_SHAPE
}
```

---

## Step 12: Run generation and validation

**Note:** `schemas/likec4-config.schema.json` is auto-generated from the types and does not need manual editing.

Run these commands in order:

```bash
pnpm generate          # Regenerate Langium parser + styled-system types
pnpm typecheck         # Verify TypeScript types
pnpm test              # Run tests (auto-updates snapshots)
pnpm build             # Final build verification
```

Snapshot files that will auto-update:
- `packages/generators/src/mmd/__snapshots__/generate-mmd.spec.ts.snap`
- `packages/generators/src/puml/__snapshots__/generate-puml.spec.ts.snap`

---

## Step 13: Create changeset

```bash
pnpm changeset
```

Select affected packages (at minimum `@likec4/diagram` and `likec4`), choose `patch` bump, and write a description like "Add new `YOUR_SHAPE` element shape".

---

## Complete File Checklist

| # | File | Required? | Purpose |
|---|------|-----------|---------|
| 1 | `styled-system/preset/src/defaults/types.ts` | Always | Core type definition |
| 2 | `packages/language-server/src/like-c4.langium` | Always | DSL grammar |
| 3 | `packages/vscode/likec4.tmLanguage.json` | Always | VSCode syntax highlighting |
| 4 | `apps/playground/likec4.tmLanguage.json` | Always | Playground syntax highlighting |
| 5 | `apps/docs/likec4.tmLanguage.json` | Always | Docs syntax highlighting |
| 6 | `packages/diagram/src/base-primitives/element/ElementShape.tsx` | Always | SVG rendering |
| 7 | `packages/diagram/src/context/IconRenderer.tsx` | Always | Shape icon mapping |
| 8 | `styled-system/preset/src/recipes/elementNodeData.ts` | If shape has overlapping decorations | Text padding |
| 9 | `styled-system/preset/src/recipes/elementShape.ts` | If shape has custom CSS parts | Shape part styling |
| 10 | `packages/layouts/src/graphviz/DotPrinter.ts` | If shape has non-standard bounding box | Layout sizing |
| 11 | `packages/generators/src/drawio/generate-drawio.ts` | Always | DrawIO export |
| 12 | `packages/generators/src/puml/generate-puml.ts` | Always | PlantUML export |
| 13 | `packages/generators/src/mmd/generate-mmd.ts` | Always | Mermaid export |
| 14 | `packages/generators/src/d2/generate-d2.ts` | Always | D2 export |
| 15 | `packages/language-server/src/lsp/CompletionProvider.spec.ts` | Always | LSP completion test |
| 16 | `.changeset/<slug>.md` | Always | Release changeset |
| 17 | `e2e/src/likec4/views.c4` | Recommended | E2E test example |

**Auto-generated (do not edit manually):** `schemas/likec4-config.schema.json` is generated from types.

---

## Key Architecture Notes

- **PandaCSS conditions** (`_shapeYourShape`) are auto-generated from the `ElementShapes` array via `styled-system/preset/src/conditions.ts:18-21`. No manual condition setup needed.
- **Generated files** (under `packages/language-server/src/generated/`, `styled-system/styles/dist/`) are regenerated by `pnpm generate`. Never edit them manually.
- The `nonexhaustive()` helper from `@likec4/core` is used in switch statements to ensure all shapes are handled. TypeScript will error if you add a shape to the type but miss a switch case.
- Shape icons in `IconRenderer.tsx` must be `ForwardRefExoticComponent` from `@tabler/icons-react`.
- All shape names are single lowercase words (no hyphens or underscores).
