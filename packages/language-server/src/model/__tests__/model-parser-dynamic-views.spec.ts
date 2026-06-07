import { invariant, stepGuards } from '@likec4/core'
import { describe, it } from 'vitest'
import type { ParsedAstDynamicView, ParsedAstView } from '../../ast'
import { createTestServices } from '../../test'

function source(viewSource: string | TemplateStringsArray) {
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

async function parseView(viewSource: string): Promise<ParsedAstDynamicView> {
  using t = createTestServices()
  const { document } = await t.validate(source(viewSource))
  const { c4Views: [view] } = t.services.likec4.ModelParser.parse(document)
  invariant(view && view?._type === 'dynamic', 'Expected dynamic view')
  return view
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
          "id": "/steps@0",
          "line": "dotted",
          "source": "A",
          "tail": "open",
          "target": "B",
          "title": "title 1",
        },
      ]
    `)
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
    expect(view.steps).toMatchInlineSnapshot(
      `
      [
        {
          "_type": "series",
          "id": "/steps@0",
          "steps": [
            {
              "astPath": "/steps@0/source/source",
              "id": "/steps@0/source/source",
              "source": "A",
              "target": "B",
            },
            {
              "astPath": "/steps@0/source",
              "id": "/steps@0/source",
              "source": "B",
              "target": "C",
            },
            {
              "astPath": "/steps@0",
              "id": "/steps@0",
              "source": "C",
              "target": "D",
            },
          ],
        },
        {
          "_type": "par",
          "id": "/steps@1",
          "steps": [
            {
              "_type": "series",
              "id": "/steps@1/steps@0",
              "steps": [
                {
                  "astPath": "/steps@1/steps@0/source",
                  "id": "/steps@1/steps@0/source",
                  "source": "A",
                  "target": "C",
                },
                {
                  "astPath": "/steps@1/steps@0",
                  "id": "/steps@1/steps@0",
                  "source": "C",
                  "target": "B",
                },
              ],
            },
            {
              "astPath": "/steps@1/steps@1",
              "id": "/steps@1/steps@1",
              "source": "B",
              "target": "D",
            },
            {
              "_type": "series",
              "id": "/steps@1/steps@2",
              "steps": [
                {
                  "astPath": "/steps@1/steps@2/source",
                  "id": "/steps@1/steps@2/source",
                  "source": "A",
                  "target": "D",
                },
                {
                  "astPath": "/steps@1/steps@2",
                  "id": "/steps@1/steps@2",
                  "source": "D",
                  "target": "C",
                },
              ],
            },
          ],
        },
      ]
    `,
    )
  })

  it('derives backward step from chain', async ({ expect }) => {
    function series(view: ParsedAstView): string[] {
      invariant(view._type === 'dynamic')
      const [series] = view.steps
      invariant(stepGuards.isSeries(series))
      return series.steps.map(s => `${s.source} -> ${s.target}${s.isBackward ? ' isBackward' : ''}`)
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
          "_type": "series",
          "id": "/steps@0",
          "steps": [
            {
              "astPath": "/steps@0/source",
              "id": "/steps@0/source",
              "source": "A",
              "target": "B",
              "title": "title 1",
            },
            {
              "astPath": "/steps@0",
              "id": "/steps@0",
              "source": "B",
              "target": "C",
              "title": "title 2",
            },
          ],
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
          "_type": "series",
          "id": "/steps@0",
          "steps": [
            {
              "astPath": "/steps@0/source",
              "color": "red",
              "id": "/steps@0/source",
              "source": "A",
              "target": "B",
              "title": "title 1",
            },
            {
              "astPath": "/steps@0",
              "id": "/steps@0",
              "source": "B",
              "target": "C",
              "title": "title 2",
            },
          ],
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
          "_type": "series",
          "id": "/steps@0",
          "steps": [
            {
              "astPath": "/steps@0/source",
              "id": "/steps@0/source",
              "kind": "uses",
              "source": "A",
              "target": "B",
            },
            {
              "astPath": "/steps@0",
              "id": "/steps@0",
              "kind": "uses",
              "source": "B",
              "target": "C",
              "title": "title 2",
            },
          ],
        },
      ]
    `)
  })

  it('parses try step', async ({ expect }) => {
    const view = await parseView(`
        dynamic view index {
          try {
            A -[uses]-> B
          } catch {
            B -[uses]-> C
          }
        }
    `)
    expect(view.steps).toHaveLength(1)
    expect(view.steps[0]).toMatchInlineSnapshot(`
      {
        "_type": "try",
        "catch": {
          "steps": [
            {
              "astPath": "/steps@0/catch/steps@0",
              "id": "/steps@0/catch/steps@0",
              "kind": "uses",
              "source": "B",
              "target": "C",
            },
          ],
        },
        "id": "/steps@0",
        "try": {
          "steps": [
            {
              "astPath": "/steps@0/try/steps@0",
              "id": "/steps@0/try/steps@0",
              "kind": "uses",
              "source": "A",
              "target": "B",
            },
          ],
        },
      }
    `)
  })

  it('parses try step with empty catch and finally', async ({ expect }) => {
    const view = await parseView(`
        dynamic view index {
          try {
            A -[uses]-> B
          } catch {
          } finally {
          }
        }
    `)
    expect(view.steps).toHaveLength(1)
    expect(view.steps[0]).toMatchInlineSnapshot(`
      {
        "_type": "try",
        "id": "/steps@0/tryCatch/try",
        "try": {
          "steps": [
            {
              "astPath": "/steps@0/tryCatch/try/steps@0",
              "id": "/steps@0/tryCatch/try/steps@0",
              "kind": "uses",
              "source": "A",
              "target": "B",
            },
          ],
        },
      }
    `)
  })
})
