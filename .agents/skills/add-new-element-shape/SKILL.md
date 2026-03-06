---
name: add-new-element-shape
description: Use when you need to add a new element shape to the LikeC4 codebase. Trigger this skill whenever the user mentions adding a shape, creating a new shape, implementing a shape, or asks about how shapes work in LikeC4. Also trigger when the user provides a visual reference image and wants it turned into an element shape. Even if the user just says "new shape" or drops an image of a shape they want — use this skill.
---

# Add New Element Shape — Agentic Workflow

You are an agent implementing a new element shape in the LikeC4 codebase. Follow this workflow phase by phase. **Do not skip phases or reorder steps.** Pause at marked checkpoints and wait for user confirmation before continuing.

---

## Phase 0: Gather Requirements

### 0.1 Confirm inputs

You need two things before starting:

1. **A reference image** — a visual showing what the shape should look like. If the user hasn't provided one, ask:
   > I need a visual reference for the shape — a screenshot, sketch, or example from another tool. Can you share one?

2. **The shape name** — a single lowercase word, no hyphens or underscores (e.g., `hexagon`, `cloud`, `diamond`). If the user hasn't specified one, propose a name based on the reference image and confirm it.

### 0.2 Understand the shape characteristics

Before writing any code, determine:

- **Outline type:** Is the shape rectangular, or does it have a custom path (curved, polygonal)?
- **Decorations:** Does it have sub-elements overlapping the text area (like `component`'s corner squares, or `browser`'s address bar)?
- **Closest existing shape:** Which existing shape is most similar? This will be your sketch host.

Read the existing shapes to inform your decision:

```
view packages/diagram/src/base-primitives/element/ElementShape.tsx
```

Study the `ShapeSvg` function. Identify which `case` block is closest to what you need to build.

---

## Phase 1: Sketch & Validate (interactive)

The goal is to get a visual prototype in front of the user as fast as possible, without changing types, grammar, or any wiring files.

### 1.1 Hijack an existing shape for sketching

Pick the closest existing shape (from Phase 0) and **comment out its rendering**, replacing it with your new SVG implementation under the same `case`. This lets the shape render in a running app immediately.

Use `str_replace` to edit `packages/diagram/src/base-primitives/element/ElementShape.tsx`:

```typescript
case 'cylinder': {
  // --- ORIGINAL (commented out for sketch) ---
  // svg = <CylinderShape w={w} h={h} size={size} />

  // --- SKETCH: "YOUR_SHAPE" ---
  svg = (
    <g>
      {/* Your new SVG implementation */}
    </g>
  )
  break
}
```

Also update the corresponding `case` in `ShapeSvgOutline` if the shape has a non-rectangular outline.

### SVG conventions

- Main fill: no `data-likec4-fill` attribute (inherits from parent)
- `data-likec4-fill="mix-stroke"` for stroke-fill mix coloring
- `data-likec4-fill="fill"` for fill-colored sub-elements
- `strokeWidth={0}` for filled areas, `strokeWidth={2}` for outlined strokes
- For responsive sizing, switch on the `size` parameter (`'xs' | 'sm' | 'md' | 'lg' | 'xl'`)

### Shape pattern reference

| Pattern                          | Examples                                           | Use when                              |
| -------------------------------- | -------------------------------------------------- | ------------------------------------- |
| Rectangle + decorations          | `'component'`, `'person'`                          | Rectangle with extras                 |
| Custom SVG path                  | `'cylinder'`, `'queue'`, `'bucket'`, `'document'`  | Curved or non-rectangular outline     |
| Box with inner header/chrome     | `'browser'`, `'mobile'`                            | Container with UI elements            |

### ✅ CHECKPOINT: User validates the sketch

Present the result to the user:

> Here's the sketch of the `YOUR_SHAPE` shape. I've temporarily replaced `cylinder` to render it. Take a look and let me know if you'd like to adjust anything — proportions, stroke treatment, responsive sizing, sub-element placement, etc.

**WAIT FOR USER APPROVAL.** Iterate on the sketch as many times as needed. Only proceed to Phase 2 after explicit confirmation.

---

## Phase 2: Wire Everything Up (automated)

Now that the visual is approved, register the shape across the codebase. This phase is fully mechanical — no user input needed.

### 2.1 Core type definition

**File:** `styled-system/preset/src/defaults/types.ts`

Read the file, find the `ElementShapes` array, and add your shape name. This is the single source of truth — `ElementShape` type and PandaCSS conditions are derived from it.

```
view styled-system/preset/src/defaults/types.ts
```

Use `str_replace` to add the shape to the array.

### 2.2 Langium grammar

**File:** `packages/language-server/src/like-c4.langium`

Find the `ElementShape returns string:` rule and add the new shape to the alternation.

```
view packages/language-server/src/like-c4.langium
```

### 2.3 TextMate grammars (syntax highlighting × 3)

Run the helper script to update all three tmLanguage files at once:

```bash
python3 /path/to/skill/scripts/update_tmgrammars.py YOUR_SHAPE
```

The script updates:
- `packages/vscode/likec4.tmLanguage.json`
- `apps/playground/likec4.tmLanguage.json`
- `apps/docs/likec4.tmLanguage.json`

**Verify** the script succeeded by spot-checking one file:

```
view packages/vscode/likec4.tmLanguage.json
```

### 2.4 Move sketch to proper case block

Go back to `packages/diagram/src/base-primitives/element/ElementShape.tsx`:

1. **Restore** the original shape you hijacked — uncomment its code and remove your sketch from its `case`.
2. **Add** a new `case 'YOUR_SHAPE':` block in `ShapeSvg` with the approved SVG.
3. **Add** a new `case 'YOUR_SHAPE':` in `ShapeSvgOutline` — or let it fall through to the `default` (rounded rect) if the shape is rectangular.

### 2.5 Icon mapping

**File:** `packages/diagram/src/context/IconRenderer.tsx`

Read the file, find the `ShapeIcons` object, and add a mapping. The icon must be from `@tabler/icons-react` and be a `ForwardRefExoticComponent`. Choose an icon that visually represents the shape. Fallback: `IconRectangularPrism`.

### 2.6 Export generators (× 4)

For each generator file, read it, find the shape switch, and add a case. If there's no native equivalent in the target format, fall through to `rectangle`.

| File                                                     | Format   |
| -------------------------------------------------------- | -------- |
| `packages/generators/src/drawio/generate-drawio.ts`      | DrawIO   |
| `packages/generators/src/puml/generate-puml.ts`          | PlantUML |
| `packages/generators/src/mmd/generate-mmd.ts`            | Mermaid  |
| `packages/generators/src/d2/generate-d2.ts`              | D2       |

For each one: `view` the file → find the switch → `str_replace` to add the case.

### 2.7 CompletionProvider test

**File:** `packages/language-server/src/lsp/CompletionProvider.spec.ts`

Find the `expectedItems` array for shape completions and add the shape in the same order as the Langium grammar.

### 2.8 Conditional steps

Evaluate these based on your shape's characteristics from Phase 0. **Skip if not needed:**

**Shape-specific padding** (only if decorations overlap text area):
- File: `styled-system/preset/src/recipes/elementNodeData.ts`
- Add `_shapeYourShape: { paddingLeft: ... }` (condition name is auto-generated from `ElementShapes`)

**Shape-specific CSS parts** (only if custom sub-elements need their own styles):
- File: `styled-system/preset/src/recipes/elementShape.ts`
- Add part definition + styling in the `svg` variant

**Layout engine sizing** (only if non-standard bounding box):
- File: `packages/layouts/src/graphviz/DotPrinter.ts`
- Add case in `addNode` method with adjusted width/margin

### 2.9 E2E test (recommended)

**File:** `e2e/src/likec4/views.c4`

Add a style rule using the new shape:

```
style some_element {
  shape YOUR_SHAPE
}
```

---

## Phase 3: Generate, Test, Verify (automated)

Run these commands in order and report results:

```bash
pnpm generate          # Regenerate Langium parser + styled-system types
```

If `pnpm generate` fails, check your grammar syntax in the `.langium` file.

```bash
pnpm typecheck
```

If typecheck fails, look at the errors — `nonexhaustive()` will tell you exactly which switch statements are missing the new shape. Fix each one.

```bash
pnpm test
```

Snapshot files will auto-update:
- `packages/generators/src/mmd/__snapshots__/generate-mmd.spec.ts.snap`
- `packages/generators/src/puml/__snapshots__/generate-puml.spec.ts.snap`

```bash
pnpm build
```

### Self-healing

If `pnpm typecheck` reports missing switch cases (via `nonexhaustive()`), this is the type system telling you which files you missed. Read the error, find the file, add the missing case. Re-run `pnpm typecheck` until clean.

---

## Phase 4: Changeset & Summary

### 4.1 Create changeset

```bash
pnpm changeset
```

Select affected packages (at minimum `@likec4/diagram` and `likec4`), choose `patch`, description: "Add new `YOUR_SHAPE` element shape".

### 4.2 Report to user

Summarize what was done:

> ✅ The `YOUR_SHAPE` shape is fully implemented. Here's what I changed:
>
> **Core:** types.ts, like-c4.langium, ElementShape.tsx, IconRenderer.tsx
> **Syntax:** 3 tmLanguage files
> **Exports:** DrawIO, PlantUML, Mermaid, D2
> **Tests:** CompletionProvider.spec.ts, e2e/views.c4
> **Conditional:** [list any conditional files that were edited, or "none needed"]
>
> All checks pass: generate ✅ typecheck ✅ test ✅ build ✅

---

## Architecture Notes

- **`ElementShape` type** is derived from the `ElementShapes` array in `types.ts` — this is the single source of truth.
- **PandaCSS conditions** (`_shapeYourShape`) are auto-generated from `ElementShapes` via `styled-system/preset/src/conditions.ts:18-21`.
- **Generated files** (under `packages/language-server/src/generated/`, `styled-system/styles/dist/`) are rebuilt by `pnpm generate`. Never edit manually.
- **`schemas/likec4-config.schema.json`** is auto-generated from types. Do not edit manually.
- **`nonexhaustive()`** from `@likec4/core` enforces exhaustive switch coverage — TypeScript errors guide you to missing cases.
- **Shape names** must be single lowercase words (no hyphens or underscores).
- **Shape icons** must be `ForwardRefExoticComponent` from `@tabler/icons-react`.
