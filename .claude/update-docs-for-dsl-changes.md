# Agent Instructions: Updating LikeC4 Docs for DSL Changes

You are an agent that updates the LikeC4 documentation site when DSL features change (new shapes, new properties, etc). The docs site is an **Astro + Starlight** app at `apps/docs/`.

**Before starting:** Read the root `AGENTS.md` for project conventions.

---

## Docs Site Structure

```
apps/docs/
├── src/
│   ├── content/docs/          # MDX documentation pages (Starlight content)
│   │   └── dsl/               # DSL reference docs
│   │       ├── styling.mdx    # Shape, color, size, border, opacity docs
│   │       ├── specification.mdx
│   │       ├── notations.mdx
│   │       ├── model.mdx
│   │       └── Views/         # View-related docs
│   └── components/
│       └── likec4-theme/      # .c4 example files + Astro components
│           ├── colors.c4      # AUTO-GENERATED - all shapes x all colors
│           ├── allshapes.c4   # View showing all shapes for primary color
│           ├── LikeC4ThemeView.astro  # Renders .c4 views inline in docs
│           └── *.c4           # Other example files
├── scripts/
│   └── generate-theme-c4.mts  # Script that generates colors.c4
├── likec4.tmLanguage.json     # TextMate grammar for code blocks
└── package.json
```

---

## When Adding a New Element Shape

### Step 1: Update the generator script

**File:** `apps/docs/scripts/generate-theme-c4.mts`

Add the new shape to the `shapes` array (around line 13-22):

```typescript
const shapes = [
  'rectangle',
  'browser',
  'storage',
  'bucket',
  'person',
  'mobile',
  'queue',
  'document',
  'YOUR_SHAPE',  // <-- add here
] as const
```

Then regenerate colors.c4:

```bash
cd apps/docs && npx tsx scripts/generate-theme-c4.mts
```

This regenerates `apps/docs/src/components/likec4-theme/colors.c4` with shape x color examples for every combination. **Never edit `colors.c4` manually** - it has a "DO NOT EDIT MANUALLY" header.

### Step 2: Update the styling reference page

**File:** `apps/docs/src/content/docs/dsl/styling.mdx`

Find the shapes section (around line 75-89) and add the new shape to the prose list:

**Before:**
```
Available shapes: `rectangle` (default), `storage`, `cylinder`, `browser`, `mobile`, `person`, `queue`, `bucket`, and `document`.
```

**After:**
```
Available shapes: `rectangle` (default), `storage`, `cylinder`, `browser`, `mobile`, `person`, `queue`, `bucket`, `document`, and `YOUR_SHAPE`.
```

The `<LikeC4ThemeView viewId="allshapes"/>` component on the next line will automatically pick up the new shape from `colors.c4` since `allshapes.c4` includes `colors.primary.*`.

### Step 3: Update TextMate grammar for docs code blocks

**File:** `apps/docs/likec4.tmLanguage.json`

Find the shapes pattern and add the new shape to the regex alternation. Search for the existing shapes like `rectangle|person|browser` and add `YOUR_SHAPE` to the group.

**Note:** The docs TextMate grammar may differ slightly from the VSCode one. Search carefully for the right pattern.

### Step 4: Verify locally (optional)

```bash
cd apps/docs && pnpm dev
```

Check that:
- The styling page (`/dsl/styling/`) shows the new shape in the "All Shapes" diagram
- Code blocks with `shape YOUR_SHAPE` get syntax highlighting
- The shape name appears in the prose list

---

## When Changing Other DSL Properties

The same pattern applies for other style properties documented in `styling.mdx`:

| Property | Docs section | Example component |
|----------|-------------|-------------------|
| Shape | `### Shape` (~line 75) | `<LikeC4ThemeView viewId="allshapes"/>` |
| Color | `### Color` (~line 91) | `<LikeC4ThemeView viewId="index"/>` |
| Size | `### Size` (~line 130) | `<LikeC4ThemeView viewId="sizes"/>` |
| Opacity | `### Opacity` (~line 148) | `<LikeC4ThemeView viewId="opacity"/>` |
| Border | `### Border` (~line 167) | `<LikeC4ThemeView viewId="borders"/>` |
| Multiple | `### Multiple` (~line 184) | `<LikeC4ThemeView viewId="multiple"/>` |
| Icon | `### Icon` (~line 200) | `<LikeC4ThemeView viewId="icons"/>` |

Each property section follows the same pattern:
1. Code example showing DSL syntax
2. Prose listing available values
3. `<LikeC4ThemeView>` component rendering a live example from `.c4` files

---

## Key Files Reference

| File | Purpose | Auto-generated? |
|------|---------|----------------|
| `apps/docs/src/content/docs/dsl/styling.mdx` | Main style property reference | No - edit manually |
| `apps/docs/src/content/docs/dsl/specification.mdx` | Element kind definitions | No - edit manually |
| `apps/docs/src/content/docs/dsl/notations.mdx` | Notation/legend docs | No - edit manually |
| `apps/docs/scripts/generate-theme-c4.mts` | Generates colors.c4 | No - edit manually |
| `apps/docs/src/components/likec4-theme/colors.c4` | All shapes x all colors | **Yes** - run script |
| `apps/docs/src/components/likec4-theme/allshapes.c4` | View: all shapes for primary | No - but rarely needs changes |
| `apps/docs/src/components/likec4-theme/LikeC4ThemeView.astro` | Renders .c4 views inline | No - but rarely needs changes |
| `apps/docs/likec4.tmLanguage.json` | Syntax highlighting in code blocks | No - edit manually |

---

## Important Notes

- The docs site uses **Astro + Starlight** with MDX content pages.
- Interactive diagram examples are rendered by `LikeC4ThemeView.astro`, which reads `.c4` files in `src/components/likec4-theme/` and renders them using the LikeC4 React viewer.
- `colors.c4` is generated by `scripts/generate-theme-c4.mts`. It creates specification entries, model elements (one per shape x color), and views per shape and per color. **Always regenerate, never hand-edit.**
- `allshapes.c4` defines a view `allshapes` that shows `colors.primary.*` - it automatically includes all shapes defined in `colors.c4` for the primary color.
- Code blocks in MDX use the `likec4` language identifier and are highlighted by the TextMate grammar at `apps/docs/likec4.tmLanguage.json`.
