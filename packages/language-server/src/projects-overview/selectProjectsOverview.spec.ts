import { describe, it } from 'vitest'
import { selectProjectsOverview } from './selectProjectsOverview'

const grouped = {
  groupBy: { key: 'domain', thenBy: { key: 'team' } },
  routing: 'ortho' as const,
}

describe('selectProjectsOverview', () => {
  it('returns no options when no project sets the overview', ({ expect }) => {
    expect(selectProjectsOverview([])).toEqual({ options: undefined, warning: undefined })
  })

  it('uses the only config', ({ expect }) => {
    const selected = selectProjectsOverview([
      { id: 'landscape', folder: 'file:///workspace/landscape/', overview: grouped },
    ])
    expect(selected.options).toEqual(grouped)
    expect(selected.warning).toBeUndefined()
  })

  it('accepts the same config on several projects', ({ expect }) => {
    const selected = selectProjectsOverview([
      { id: 'b', folder: 'file:///workspace/b/', overview: { ...grouped } },
      {
        id: 'a',
        folder: 'file:///workspace/a/nested/',
        overview: { routing: 'ortho', groupBy: { key: 'domain', thenBy: { key: 'team' } } },
      },
    ])
    expect(selected.options).toEqual(grouped)
    expect(selected.warning).toBeUndefined()
  })

  it('uses the shortest folder when configs differ and warns', ({ expect }) => {
    const selected = selectProjectsOverview([
      { id: 'nested', folder: 'file:///workspace/team/nested/', overview: { routing: 'spline' } },
      { id: 'root', folder: 'file:///workspace/', overview: grouped },
      { id: 'other', folder: 'file:///workspace/other/', overview: { routing: 'spline' } },
    ])
    expect(selected.options).toEqual(grouped)
    expect(selected.warning).toBe(
      'Projects overview is set on more than one project. Using root. Also set on other, nested.',
    )
  })
})
