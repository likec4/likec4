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
