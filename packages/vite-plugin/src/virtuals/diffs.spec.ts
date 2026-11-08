import JSON5 from 'json5'
import { describe, it, vi } from 'vitest'
import { projectDiffsModule } from './diffs'

describe('diffs virtual module', () => {
  it('inlines the diffs with the compare views of the views they change', async ({ expect }) => {
    const diff = {
      id: 'rfc1',
      title: 'RFC 1',
      description: null,
      added: { elements: 1, relations: 0 },
      removed: { elements: 0, relations: 0 },
      modified: { elements: 0 },
      views: [{ id: 'index', title: null, nodes: { added: 1, removed: 0, modified: 0 }, edges: {} }],
    }
    const layoutCompareView = vi.fn<(params: { viewId: string }) => Promise<object>>(
      async ({ viewId }) => ({ id: viewId, nodes: [], edges: [] }),
    )
    const result = await projectDiffsModule.load.call({} as any, {
      project: { id: 'default' },
      likec4: { modelDiffs: { list: async () => [diff], layoutCompareView } },
    } as any)

    const code = typeof result === 'string' ? result : result.code
    const inlined = JSON5.parse(code.match(/export let \$diffs = atom\((.*)\)\n/)?.[1] ?? 'null')
    expect(layoutCompareView).toHaveBeenCalledWith({ projectId: 'default', diffId: 'rfc1', viewId: 'index' })
    expect(inlined).toEqual({
      diffs: [diff],
      views: { rfc1: { index: { id: 'index', nodes: [], edges: [] } } },
    })
  })
})
