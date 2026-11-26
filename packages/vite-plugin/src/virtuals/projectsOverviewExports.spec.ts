import { describe, it } from 'vitest'
import { overviewExportFormats } from './projectsOverviewExports'

describe('overviewExportFormats', () => {
  it('when no project restricts formats then enables all formats', ({ expect }) => {
    expect(overviewExportFormats([{}, {}])).toEqual(['png', 'jpg', 'dot', 'd2', 'mmd', 'puml', 'drawio'])
  })

  it('when one project restricts formats then keeps only shared formats', ({ expect }) => {
    expect(overviewExportFormats([{}, { webapp: { exportFormats: ['png', 'dot'] } }])).toEqual(['png', 'dot'])
  })

  it('when one project disables export then enables nothing', ({ expect }) => {
    expect(overviewExportFormats([{}, { webapp: { exportFormats: [] } }])).toEqual([])
  })

  it('when there are no projects then enables nothing', ({ expect }) => {
    expect(overviewExportFormats([])).toEqual([])
  })
})
