import { invariant, isDynamicBranchCollection, isDynamicStepsSeries } from '@likec4/core'
import { describe, it } from 'vitest'
import type { ParsedAstView } from '../../ast'
import { createTestServices } from '../../test'

function source(viewSource: TemplateStringsArray) {
  return `
  specification {
    element element
    relationship uses
  }
  model {
    element A
    element B
    element C
    element D
  }
  views {
    ${viewSource}
  }
`
}

describe.concurrent('LikeC4ModelParser - dynamic views', () => {
  it('parses custom properties', async ({ expect }) => {
    const { validate, services } = createTestServices()
    const { document } = await validate(source`
        dynamic view index {
          A -> B {
            title "title 1"
            description """
              # Markdown
            """
            color red
            head diamond
            tail open
            line dotted
          }
        }
    `)
    const { c4Views } = services.likec4.ModelParser.parse(document)
    expect(c4Views).toHaveLength(1)
    const view = c4Views[0]
    invariant(view?._type === 'dynamic')
    expect(view.steps).toMatchInlineSnapshot(`
      [
        {
          "astPath": "/steps@0",
          "color": "red",
          "description": {
            "md": "# Markdown",
          },
          "head": "diamond",
          "line": "dotted",
          "source": "A",
          "tail": "open",
          "target": "B",
          "title": "title 1",
        },
      ]
    `)
  })

  it('parses named parallel paths', async ({ expect }) => {
    const { validate, services } = createTestServices()
    const { document } = await validate(source`
        dynamic view branchPaths {
          parallel {
            path success "Happy path" {
              A -> B
            }
            path failure {
              B -> C
            }
          }
        }
    `)
    const { c4Views } = services.likec4.ModelParser.parse(document)
    expect(c4Views).toHaveLength(1)
    const view = c4Views[0]
    invariant(view?._type === 'dynamic')
    const [branch] = view.steps
    invariant(branch && isDynamicBranchCollection(branch))
    expect(branch.paths).toHaveLength(2)
    const [success, failure] = branch.paths
    invariant(success && failure)
    expect(success.pathName).toBe('success')
    expect(success.pathTitle).toBe('Happy path')
    expect(success.steps).toHaveLength(1)
    expect(failure.pathName).toBe('failure')
    expect(failure.steps).toHaveLength(1)
  })

  it('parses alternate branch collections', async ({ expect }) => {
    const { validate, services } = createTestServices()
    const { document } = await validate(source`
        dynamic view alternateBranches {
          alternate {
            path optionA {
              A -> B
            }
            {
              B -> C
            }
          }
        }
    `)
    const { c4Views } = services.likec4.ModelParser.parse(document)
    expect(c4Views).toHaveLength(1)
    const view = c4Views[0]
    invariant(view?._type === 'dynamic')
    const [branch] = view.steps
    invariant(branch && isDynamicBranchCollection(branch))
    expect(branch.kind).toBe('alternate')
    expect(branch.paths).toHaveLength(2)
    expect(branch.paths[0]!.pathName).toBe('optionA')
    expect(branch.paths[1]!.isAnonymous).toBe(true)
  })

  it('parses chained steps', async ({ expect }) => {
    const { validate, services } = createTestServices()
    const { document } = await validate(source`
        dynamic view index {
          A -> B -> C -> D
          parallel {
            A -> C -> B
            B -> D
            A -> D -> C
          }
        }
    `)
    const { c4Views } = services.likec4.ModelParser.parse(document)
    expect(c4Views).toHaveLength(1)
    const view = c4Views[0]
    invariant(view?._type === 'dynamic')
    const [series, branch] = view.steps
    invariant(series && isDynamicStepsSeries(series))
    expect(series.__series.map(({ source, target }) => [source, target])).toEqual([
      ['A', 'B'],
      ['B', 'C'],
      ['C', 'D'],
    ])

    invariant(branch && isDynamicBranchCollection(branch))
    expect(branch.kind).toBe('parallel')
    expect(branch.branchId).toBe('/steps@1')
    expect(branch.paths).toHaveLength(3)
    expect(branch.paths.map(p => p.pathId)).toEqual([
      '/steps@1/paths@0',
      '/steps@1/paths@1',
      '/steps@1/paths@2',
    ])
    if (branch.kind === 'parallel') {
      expect(branch.__parallel?.length).toBe(3)
    }
  })

  it('derives backward step from chain', async ({ expect }) => {
    function series(view: ParsedAstView): string[] {
      invariant(view._type === 'dynamic')
      const [series] = view.steps
      invariant(isDynamicStepsSeries(series))
      return series.__series.map(s => `${s.source} -> ${s.target}${s.isBackward ? ' isBackward' : ''}`)
    }
    const { validate, services } = createTestServices()
    const { document } = await validate(source`
        dynamic view v1 {
          A -> B -> A
        }
        dynamic view v2 {
          A -> B -> C -> D -> C -> B -> A
        }
        dynamic view v3 {
          A -> B -> C -> D -> B -> A -> D -> C
        }
    `)
    const { c4Views } = services.likec4.ModelParser.parse(document)
    const [v1, v2, v3] = c4Views
    invariant(v1?.id === 'v1')
    expect(series(v1)).toEqual([
      'A -> B',
      'B -> A isBackward',
    ])

    invariant(v2?.id === 'v2')
    expect(series(v2)).toEqual([
      'A -> B',
      'B -> C',
      'C -> D',
      'D -> C isBackward',
      'C -> B isBackward',
      'B -> A isBackward',
    ])

    invariant(v3?.id === 'v3')
    expect(series(v3)).toEqual([
      'A -> B',
      'B -> C',
      'C -> D',
      'D -> B',
      'B -> A isBackward',
      'A -> D',
      'D -> C',
    ])
  })

  it('parses chained steps with titles', async ({ expect }) => {
    const { validate, services } = createTestServices()
    const { document } = await validate(source`
        dynamic view index {
          A -> B "title 1" -> C "title 2"
        }
    `)
    const { c4Views } = services.likec4.ModelParser.parse(document)
    expect(c4Views).toHaveLength(1)
    const view = c4Views[0]
    invariant(view?._type === 'dynamic')
    expect(view.steps).toMatchInlineSnapshot(`
      [
        {
          "__series": [
            {
              "astPath": "/steps@0/source",
              "source": "A",
              "target": "B",
              "title": "title 1",
            },
            {
              "astPath": "/steps@0",
              "source": "B",
              "target": "C",
              "title": "title 2",
            },
          ],
          "seriesId": "/steps@0",
        },
      ]
    `)
  })

  it('parses chained steps with body', async ({ expect }) => {
    const { validate, services } = createTestServices()
    const { document } = await validate(source`
        dynamic view index {
          A -> B {
            title "title 1"
            color red
          }
            -> C "title 2"
        }
    `)
    const { c4Views } = services.likec4.ModelParser.parse(document)
    expect(c4Views).toHaveLength(1)
    const view = c4Views[0]
    invariant(view?._type === 'dynamic')
    expect(view.steps).toMatchInlineSnapshot(`
      [
        {
          "__series": [
            {
              "astPath": "/steps@0/source",
              "color": "red",
              "source": "A",
              "target": "B",
              "title": "title 1",
            },
            {
              "astPath": "/steps@0",
              "source": "B",
              "target": "C",
              "title": "title 2",
            },
          ],
          "seriesId": "/steps@0",
        },
      ]
    `)
  })

  it('parses chain of kinded steps', async ({ expect }) => {
    const { validate, services } = createTestServices()
    const { document } = await validate(source`
        dynamic view index {
          A -[uses]-> B .uses C "title 2"
        }
    `)
    const { c4Views } = services.likec4.ModelParser.parse(document)
    expect(c4Views).toHaveLength(1)
    const view = c4Views[0]
    invariant(view?._type === 'dynamic')
    expect(view.steps).toMatchInlineSnapshot(`
      [
        {
          "__series": [
            {
              "astPath": "/steps@0/source",
              "kind": "uses",
              "source": "A",
              "target": "B",
            },
            {
              "astPath": "/steps@0",
              "kind": "uses",
              "source": "B",
              "target": "C",
              "title": "title 2",
            },
          ],
          "seriesId": "/steps@0",
        },
      ]
    `)
  })
})
