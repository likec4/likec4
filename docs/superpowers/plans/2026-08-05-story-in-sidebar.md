# Stories in the Sidebar View List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make stories show up in the existing sidebar view list (`packages/likec4-spa/src/components/sidebar/DiagramsTree.tsx`, single-project mode only — `_single/single-index.tsx`) with their own distinct icon, and make them clickable by adding the missing single-project-mode story routes.

**Architecture:** The sidebar tree (`sidebar/data.ts`'s `buildDiagramTreeData`) currently builds its data purely from `model.views()`. `LikeC4Model` already exposes `.stories()` (proven by `StoryReact.tsx` and `hooks.ts`'s `useCurrentStory`, which already consume it) — no core, language-server, or vite-plugin change is needed. Add stories as a second, flat (ungrouped) list of tree nodes alongside views, with icon dispatch following the tree's existing `node.type`-based pattern (`view` → `IconLayoutDashboard`, `deployment-view` → `IconStack2`). Clicking a story node needs a route to land on: single-project mode (`_single/*`) has no story routes today (only `project.$projectId/story/$storyId/...` does) — this plan adds the three-file mirror under `_single/`, reusing `pages/StoryReact.tsx` unchanged in structure but with one real fix (see Step 4): its "exit to a non-story view" fallback is hardcoded to the `project.$projectId` route shape and would 404 under `_single`.

**Tech Stack:** TanStack Router file-based routes, Mantine `Tree`, `@tabler/icons-react`.

**Scope decision (confirmed with the user):** single-project mode only. The sidebar is not currently wired into multi-project mode (`project.$projectId/*` has no equivalent sidebar/tree component) — that's out of scope for this plan.

## Global Constraints

- Branch: continue directly on `story-view-implementation` (no worktree needed).
- `origin` is upstream `likec4/likec4` — never push there. Fork remote is `fork`. Do not push unless explicitly asked.
- Stage explicit paths only — never `git add -A`.
- No changesets (unreleased POC branch).
- Commit when done, Conventional Commits style.

---

### Task 1: Story routes under `_single`, sidebar tree data, and the icon

**Files:**
- Create: `packages/likec4-spa/src/routes/_single/story.$storyId.tsx`
- Create: `packages/likec4-spa/src/routes/_single/story.$storyId.index.tsx`
- Create: `packages/likec4-spa/src/routes/_single/story.$storyId.view.$viewId.tsx`
- Modify: `packages/likec4-spa/src/pages/StoryReact.tsx` (lines 43-51, the `onNavigateTo` fallback)
- Modify: `packages/likec4-spa/src/components/sidebar/data.ts`
- Modify: `packages/likec4-spa/src/components/sidebar/DiagramsTree.tsx`
- Create: `packages/likec4-spa/src/components/sidebar/data.spec.ts`

**Interfaces:**
- Consumes: `LikeC4Model.stories(): IteratorLike<LikeC4StoryModel>` (`packages/core/src/model/LikeC4Model.ts:545`), already available via `useLikeC4Model()` (`@likec4/diagram`) exactly like `.views()` is consumed today in `sidebar/data.ts`. `LikeC4StoryModel` (`packages/core/src/model/story/LikeC4StoryModel.ts`) exposes `.id` and `.title` getters — no `.sourcePath`, so stories are never grouped into file/folder nodes, only ever appended flat at tree-root level.
- Produces: `DiagramTreeNodeData['type']` gains `'story'`. `buildDiagramTreeData`'s signature changes to `(views, stories, groupBy)`.

**Step 1: New route file — story layout**

Create `packages/likec4-spa/src/routes/_single/story.$storyId.tsx`, mirroring the existing `packages/likec4-spa/src/routes/_single/view.$viewId.tsx` exactly (same layout shape, just a different path segment):

```tsx
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { ErrorComponent } from '../../components/ErrorComponent'
import { Header } from '../../components/view-page/Header'

export const Route = createFileRoute('/_single/story/$storyId')({
  component: StoryLayout,
  errorComponent: ErrorComponent,
})

function StoryLayout() {
  return (
    <>
      <Outlet />
      <Header />
    </>
  )
}
```

**Step 2: New route file — index redirect to the first scene**

Create `packages/likec4-spa/src/routes/_single/story.$storyId.index.tsx`. This mirrors `packages/likec4-spa/src/routes/project.$projectId/story.$storyId.index.tsx`, but there is no `params.projectId` under `_single` — use `context.projectId` instead, exactly the way the parent route `packages/likec4-spa/src/routes/_single/route.tsx` already obtains it (`loader: async ({ context }) => { const projectId = context.projectId; ... }`). `context.projectId` is set at the root route (`packages/likec4-spa/src/routes/__root.tsx:48`, `projectId: _projects[0]`) and flows down to every `_single/*` route the same way:

```tsx
import { createFileRoute, notFound, redirect } from '@tanstack/react-router'
import { loadModel } from 'likec4:model'

export const Route = createFileRoute('/_single/story/$storyId/')({
  beforeLoad: async ({ params, context }) => {
    const likec4model = await loadModel(context.projectId)
    const model = likec4model.$likec4model.get()
    const story = model.findStory(params.storyId as any)
    const firstScene = story?.scenes[0]
    if (!firstScene) {
      throw notFound()
    }
    throw redirect({
      to: '/_single/story/$storyId/view/$viewId/',
      params: { ...params, viewId: firstScene.view },
    })
  },
})
```

**Step 3: New route file — the story-scene page**

Create `packages/likec4-spa/src/routes/_single/story.$storyId.view.$viewId.tsx`, mirroring `packages/likec4-spa/src/routes/project.$projectId/story.$storyId.view.$viewId.tsx` exactly (same component, just a different route id):

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { StoryReact } from '../../pages/StoryReact'

export const Route = createFileRoute('/_single/story/$storyId/view/$viewId')({
  component: StoryReact,
})
```

**Step 4: Fix `StoryReact.tsx`'s route-shape-hardcoded fallback**

`packages/likec4-spa/src/pages/StoryReact.tsx`'s `onNavigateTo` (read the whole function, currently lines ~31-52) has two branches: navigating to another scene of the *same* story (already route-tree-agnostic — it uses relative `to: './'` with a spread of `current` params, so it already works under any parent route). The second branch, for a target that is **not** one of the story's own scenes, currently always does:

```tsx
    } else {
      // Target isn't one of this story's scenes — drop to the flat view route.
      void navigate({
        to: '/project/$projectId/view/$viewId/',
        viewTransition: false,
        params: (current: any) => ({ projectId: current.projectId, viewId: targetViewId }),
        search: true,
      })
    }
```

This is hardcoded to the `project.$projectId` route shape and has no equivalent under `_single` (whose flat view route is `/view/$viewId/`, with no `projectId` segment at all) — navigating away from a story to a non-story view while mounted under the new `_single/story/$storyId/view/$viewId` route would 404. Make it branch on whether a `projectId` param is present in the current route (i.e., which route tree this component is mounted in), the same signal `useCurrentProject` already relies on elsewhere in this package:

```tsx
    } else if (current.projectId) {
      // Target isn't one of this story's scenes — drop to the flat view route.
      void navigate({
        to: '/project/$projectId/view/$viewId/',
        viewTransition: false,
        params: (current: any) => ({ projectId: current.projectId, viewId: targetViewId }),
        search: true,
      })
    } else {
      // Single-project mode has no `projectId` segment.
      void navigate({
        to: '/view/$viewId/',
        viewTransition: false,
        params: { viewId: targetViewId },
        search: true,
      })
    }
```

Adjust the exact `if`/`else if`/`else` structure to fit around the existing first branch (the "isOwnScene" check) without duplicating it — read the full current function before editing so the final control flow has exactly three cases: own-scene / non-story-view-under-project-mode / non-story-view-under-single-mode.

**Step 5: Sidebar tree data — add stories**

In `packages/likec4-spa/src/components/sidebar/data.ts`:

1. Add `'story'` to the `DiagramTreeNodeData['type']` union (line 11) and to `isTreeNodeData`'s allowed list (line 20):

```ts
interface DiagramTreeNodeData {
  label: string
  value: string
  type: 'file' | 'folder' | 'view' | 'deployment-view' | 'story'
  // Mantine Tree treats any node with a `children` array (even an empty one) as expandable,
  // so leaf nodes (views, stories) must not have this property
  children?: DiagramTreeNodeData[]
}

export type GroupBy = 'by-files' | 'by-folders' | 'none'

export const isTreeNodeData = (node: TreeNodeData): node is DiagramTreeNodeData =>
  'type' in node && ['file', 'folder', 'view', 'deployment-view', 'story'].includes(node.type as any)
```

2. Add a `stories` parameter to `buildDiagramTreeData` and append story nodes flat at root level, after the existing per-view loop (stories have no `sourcePath`/folder concept, so `groupBy` never applies to them):

```ts
import type { LikeC4StoryModel, LikeC4ViewModel } from '@likec4/core/model'

// ...

function buildDiagramTreeData(
  views: readonly LikeC4ViewModel[],
  stories: readonly LikeC4StoryModel[],
  groupBy: GroupBy,
): DiagramTreeNodeData[] {
  const root: DiagramTreeNodeData = {
    value: '',
    label: 'Diagrams',
    type: 'folder',
    children: [],
  }

  // ... existing findParent + for (const view of views) loop, unchanged ...

  for (const story of stories) {
    root.children!.push({
      value: story.id,
      label: story.title ?? story.id,
      type: 'story',
    })
  }

  return root.children!.sort(compareTreeNodes)
}

export function useDiagramsTreeData(groupBy: GroupBy = 'by-files') {
  const model = useLikeC4Model()
  return useMemo(() => buildDiagramTreeData([...model.views()], [...model.stories()], groupBy), [model, groupBy])
}
```

Double check the existing `for (const view of views)` loop still only ever mutates `parent` (not `root` directly, except when `relativePath === ''`), so appending the new story loop after it and before the final `root.children!.sort(...)` return is safe and doesn't need its own `compareTreeNodes` call mid-loop (only the final root-level sort matters for stories, since they're always root children).

**Step 6: Sidebar tree — icon and navigation**

In `packages/likec4-spa/src/components/sidebar/DiagramsTree.tsx`:

1. Import an icon for stories from `@tabler/icons-react` — use `IconBook2` (reads as "narrative/story," distinct from the dashboard/stack icons already used for views):

```tsx
import {
  IconBook2,
  IconFileCode,
  IconFolderFilled,
  IconFolderOpen,
  IconLayoutDashboard,
  IconStack2,
  IconStarFilled,
} from '@tabler/icons-react'
```

2. Add the icon branch next to the existing `deployment-view`/`view` branches (currently lines 128-139):

```tsx
              leftSection={
                <>
                  {!hasChildren && node.value === 'index' && <IconStarFilled size={14} opacity={0.7} />}
                  {!hasChildren && node.value !== 'index' && isTreeNodeData(node) && (
                    <>
                      {node.type === 'deployment-view' && <IconStack2 size={14} />}
                      {node.type === 'view' && <IconLayoutDashboard size={14} />}
                      {node.type === 'story' && <IconBook2 size={14} />}
                    </>
                  )}
                  {hasChildren && <FolderIcon node={node} expanded={expanded} />}
                </>
              }
```

3. Stories need a different navigation target than views (`/story/$storyId/`, not `/view/$viewId/`). The current `navigateTo` (lines 59-66) is called unconditionally from the `onClick` handler (lines 141-146) with only `node.value`; it needs the node's `type` too to pick the right route:

```tsx
  const navigateTo = (node: DiagramTreeNodeData) => {
    SidebarDrawerOps.close()
    if (node.type === 'story') {
      void navigate({
        to: '/story/$storyId/',
        viewTransition: false,
        params: { storyId: node.value },
      })
      return
    }
    void navigate({
      to: '/view/$viewId/',
      viewTransition: false,
      params: { viewId: node.value },
    })
  }
```

And update the click handler to pass the whole node instead of just `node.value`:

```tsx
              {...(!hasChildren && {
                onClick: (e) => {
                  e.stopPropagation()
                  navigateTo(node)
                },
              })}
```

`navigateTo` needs `DiagramTreeNodeData`'s type in scope — it's already exported implicitly via `isTreeNodeData`'s type guard from `./data`; import it explicitly (`import { type DiagramTreeNodeData, type GroupBy, isTreeNodeData, useDiagramsTreeData } from './data'` — check whether `DiagramTreeNodeData` needs an `export` keyword added in `data.ts`, since it is currently declared without one; add `export` to its `interface DiagramTreeNodeData` declaration if missing).

Note `renderNode`'s `node` parameter is typed as Mantine's generic `TreeNodeData`, not `DiagramTreeNodeData` — the existing code already narrows via `isTreeNodeData(node)` before reading `.type` inside JSX, but the `onClick` handler calls `navigateTo(node)` on the *outer*, non-narrowed `node`. Guard the call the same way the JSX above it already does, or narrow inline: `node.type === 'story' && isTreeNodeData(node)` inside `navigateTo`, since `node.value`/`node.type` must be read from the narrowed type. Resolve this exactly (don't leave a TypeScript error), matching whatever narrowing shape satisfies `tsc --build` cleanly — read the full current file before editing, since the exact narrowing approach depends on how `renderNode`'s destructured `node` is typed at the call site.

**Step 7: Unit test for the tree-building logic**

Create `packages/likec4-spa/src/components/sidebar/data.spec.ts` (no existing test file for this module — first one):

```ts
import { describe, expect, it } from 'vitest'

// Import the same way the module re-exports its pieces; if `buildDiagramTreeData` is not
// currently exported, add `export` to it in `data.ts` for this test (it's a pure function with
// no React dependency, safe to export and test directly rather than only through the
// `useDiagramsTreeData` hook, which would require a React Testing Library render harness this
// package does not otherwise use for hook-level unit tests).
import { buildDiagramTreeData } from './data'

describe('buildDiagramTreeData', () => {
  it('includes stories as flat, root-level nodes with type "story"', () => {
    const views = [
      { id: 'v1', title: 'View One', $view: { sourcePath: '' }, isDeploymentView: () => false },
    ] as any
    const stories = [
      { id: 's1', title: 'Story One' },
      { id: 's2', title: null },
    ] as any

    const tree = buildDiagramTreeData(views, stories, 'none')

    const storyNodes = tree.filter(n => n.type === 'story')
    expect(storyNodes).toHaveLength(2)
    expect(storyNodes.find(n => n.value === 's1')).toMatchObject({ label: 'Story One', type: 'story' })
    // No title falls back to the story id, mirroring the existing view fallback (`view.title ?? view.id`).
    expect(storyNodes.find(n => n.value === 's2')).toMatchObject({ label: 's2', type: 'story' })
    // Stories never get a `children` array (they're always leaves).
    for (const node of storyNodes) {
      expect(node.children).toBeUndefined()
    }
  })

  it('stories are unaffected by groupBy (never nested under a file/folder node)', () => {
    const stories = [{ id: 's1', title: 'Story One' }] as any
    for (const groupBy of ['by-files', 'by-folders', 'none'] as const) {
      const tree = buildDiagramTreeData([], stories, groupBy)
      expect(tree).toHaveLength(1)
      expect(tree[0]).toMatchObject({ value: 's1', type: 'story' })
    }
  })
})
```

Run: `pnpm --filter @likec4/spa test` (or `cd packages/likec4-spa && pnpm exec vitest run src/components/sidebar/data.spec.ts`). Expected: both new tests pass. If `@likec4/spa`'s package name or test script differs, check `packages/likec4-spa/package.json`'s `name` and `scripts.test` fields first — this package is `private: true` and may be named differently than the directory.

**Step 8: Regenerate routes and verify end-to-end**

Run `pnpm generate` from repo root (regenerates `routeTree.gen.ts` for the three new route files — do not hand-edit that file). Then `pnpm exec tsc --build` from repo root (must be clean).

Start the dev server (`cd packages/likec4-spa && pnpm dev`) and manually verify against a project that has both views and a story — `cloud-system` (the `migration` story used elsewhere in this session) works structurally, but remember single-project mode's sidebar/`single-index` page is reached differently than the multi-project `/project/cloud-system/...` URLs you've been using; check `packages/likec4-spa/src/start-dev.ts` or the dev server's own startup log for how to reach single-project mode against a specific example project, or point `LikeC4VitePluginOptions` at a workspace containing only `cloud-system` if the multi-example dev setup doesn't have a single-project entry point reachable without reconfiguration. Confirm:
- The sidebar (single-project mode) lists the `migration` story with the `IconBook2` icon, distinguishable from view rows.
- Clicking it navigates to the story's first scene and renders correctly (reusing the same `LikeC4Diagram` + `StoryControls`/walkthrough UI already shipped).
- From inside the story, navigating to a target outside the story's own scenes (e.g. via search or a `navigateTo` relation) lands on `/view/$viewId/`, not a 404.

If no browser automation tool is available in this environment (as was true earlier in this session), rely on a clean dev-server boot plus the unit test from Step 7 and code-level review of Step 4's control flow, and say so explicitly in the report rather than claiming a visual check that didn't happen.

**Step 9: Commit**

```bash
git add packages/likec4-spa/src/routes/_single/story.\$storyId.tsx \
  packages/likec4-spa/src/routes/_single/story.\$storyId.index.tsx \
  packages/likec4-spa/src/routes/_single/story.\$storyId.view.\$viewId.tsx \
  packages/likec4-spa/src/pages/StoryReact.tsx \
  packages/likec4-spa/src/components/sidebar/data.ts \
  packages/likec4-spa/src/components/sidebar/DiagramsTree.tsx \
  packages/likec4-spa/src/components/sidebar/data.spec.ts
git commit -m "feat(likec4-spa): show stories in the single-project sidebar with a distinct icon"
```

(Do not add `routeTree.gen.ts` to this list by hand — check whether it's gitignored in this repo; if it's tracked, `pnpm generate`'s regenerated version should be included in the same commit since the new routes don't exist without it. Check `.gitignore` for `routeTree.gen.ts` before deciding.)

## Self-Review Notes

- Confirmed via direct file reads (not assumption) that `LikeC4Model.stories()`, `LikeC4StoryModel.id`/`.title`, and the `_single/route.tsx` → root route `context.projectId` chain all already exist exactly as described — no core/language-server/vite-plugin changes are needed anywhere in this plan.
- Step 4 is the one real functional bug this plan fixes, not just new code: `StoryReact.tsx`'s existing fallback navigation was written assuming it would only ever be mounted under `project.$projectId`, which was true until this plan adds a second mount point. Flagging this explicitly so the implementer treats it as a required fix, not an optional nice-to-have.
- Deliberately out of scope, per the user's own scope decision: wiring stories into multi-project mode (`project.$projectId/*` has no sidebar/tree component at all today — adding one there is a separate, larger effort this plan does not attempt).
