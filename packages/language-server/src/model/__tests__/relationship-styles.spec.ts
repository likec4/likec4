import { type ComputedEdge, invariant, isElementView } from '@likec4/core'
import { describe, it } from 'vitest'
import { createTestServices } from '../../test'

const model = `
  specification {
    element system
    relationship async
    tag critical
    tag legacy
  }
  model {
    system a
    system b
    system c
    a -> b #critical
    a -[async]-> c
    b -> c #legacy
  }
`

async function computeEdges(views: string, viewId = 'index') {
  const { validate, buildModel } = createTestServices()
  const { errors } = await validate(model + views)
  const computed = await buildModel()
  const view = computed.views[viewId]
  invariant(view && isElementView(view), `Element view ${viewId} not found`)
  const edge = (source: string, target: string): ComputedEdge => {
    const found = view.edges.find(e => e.source === source && e.target === target)
    invariant(found, `Edge ${source} -> ${target} not found`)
    return found
  }
  return { errors, edge }
}

// https://github.com/likec4/likec4/issues/1234
describe('style relationship.tag / relationship.kind', () => {
  it('styles relationships with the tag', async ({ expect }) => {
    const { errors, edge } = await computeEdges(`
      views {
        view index {
          include *
          style relationship.tag = #critical {
            color red
            line solid
            head diamond
            tail dot
          }
        }
      }
    `)
    expect(errors).toEqual([])
    expect(edge('a', 'b')).toMatchObject({ color: 'red', line: 'solid', head: 'diamond', tail: 'dot' })
    expect(edge('a', 'c').color).not.toBe('red')
    expect(edge('b', 'c').color).not.toBe('red')
  })

  it('styles relationships of the kind', async ({ expect }) => {
    const { errors, edge } = await computeEdges(`
      views {
        view index {
          include *
          style relationship.kind = async {
            line dotted
          }
        }
      }
    `)
    expect(errors).toEqual([])
    expect(edge('a', 'c').line).toBe('dotted')
    expect(edge('a', 'b').line).not.toBe('dotted')
  })

  it('styles relationships without the tag when using !=', async ({ expect }) => {
    const { errors, edge } = await computeEdges(`
      views {
        view index {
          include *
          style relationship.tag != #critical {
            color muted
          }
        }
      }
    `)
    expect(errors).toEqual([])
    expect(edge('a', 'b').color).not.toBe('muted')
    expect(edge('a', 'c').color).toBe('muted')
    expect(edge('b', 'c').color).toBe('muted')
  })

  it('matches any of several targets', async ({ expect }) => {
    const { errors, edge } = await computeEdges(`
      views {
        view index {
          include *
          style relationship.tag = #critical, relationship.kind = async {
            color amber
          }
        }
      }
    `)
    expect(errors).toEqual([])
    expect(edge('a', 'b').color).toBe('amber')
    expect(edge('a', 'c').color).toBe('amber')
    expect(edge('b', 'c').color).not.toBe('amber')
  })

  it('applies rules in order, and a with block wins', async ({ expect }) => {
    const { errors, edge } = await computeEdges(`
      views {
        view index {
          include *
          include a -> b with {
            line dashed
          }
          style relationship.tag = #critical {
            color red
            line solid
          }
          style relationship.tag = #critical {
            color green
          }
        }
      }
    `)
    expect(errors).toEqual([])
    expect(edge('a', 'b')).toMatchObject({ color: 'green', line: 'dashed' })
  })

  it('applies styles from the views block to every element view in it', async ({ expect }) => {
    const { errors, edge } = await computeEdges(
      `
      views {
        style relationship.tag = #legacy {
          color secondary
        }
        view index {
          include *
        }
        view other {
          include *
        }
        dynamic view flow {
          b -> c
        }
      }
    `,
      'other',
    )
    expect(errors).toEqual([])
    expect(edge('b', 'c').color).toBe('secondary')
  })

  it('reports an error inside a dynamic view', async ({ expect }) => {
    const { validate } = createTestServices()
    const { errors } = await validate(`${model}
      views {
        dynamic view flow {
          a -> b
          style relationship.tag = #critical {
            color red
          }
        }
      }
    `)
    expect(errors).toEqual(['Relationship styles are not supported in dynamic views'])
  })
})
