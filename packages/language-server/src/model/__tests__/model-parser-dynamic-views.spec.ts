import { invariant } from '@likec4/core'
import { describe, it } from 'vitest'
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

  it('parses chained steps', async ({ expect }) => {
    const { validate, services } = createTestServices()
    const { document } = await validate(source`
        dynamic view index {
          A -> B -> C -> D
        }
    `)
    const { c4Views } = services.likec4.ModelParser.parse(document)
    expect(c4Views).toHaveLength(1)
    const view = c4Views[0]
    invariant(view?._type === 'dynamic')
    expect(view.steps).toMatchInlineSnapshot(`
      [
        {
          "source": "A",
          "target": "B",
          "title": null,
        },
        {
          "source": "B",
          "target": "C",
          "title": null,
        },
        {
          "source": "C",
          "target": "D",
          "title": null,
        },
      ]
    `)
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
          "source": "A",
          "target": "B",
          "title": "title 1",
        },
        {
          "source": "B",
          "target": "C",
          "title": "title 2",
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
          "color": "red",
          "source": "A",
          "target": "B",
          "title": "title 1",
        },
        {
          "source": "B",
          "target": "C",
          "title": "title 2",
        },
      ]
    `)
  })

  it('parses chain of kinded steps', async ({ expect }) => {
    const { validate, services } = createTestServices()
    const { document } = await validate(source`
        dynamic view index {
          A -[uses]-> B "title 1" .uses C "title 2"
        }
    `)
    const { c4Views } = services.likec4.ModelParser.parse(document)
    expect(c4Views).toHaveLength(1)
    const view = c4Views[0]
    invariant(view?._type === 'dynamic')
    expect(view.steps).toMatchInlineSnapshot(`
      [
        {
          "kind": "uses",
          "source": "A",
          "target": "B",
          "title": "title 1",
        },
        {
          "kind": "uses",
          "source": "B",
          "target": "C",
          "title": "title 2",
        },
      ]
    `)
  })
})
