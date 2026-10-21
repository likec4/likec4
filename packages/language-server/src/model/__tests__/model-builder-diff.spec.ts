import { describe, it } from 'vitest'
import { createTestServices } from '../../test'

const base = `
  specification {
    element actor
    element system
    element component
    tag next
  }
  model {
    customer = actor 'Customer'
    cloud = system 'Cloud' {
      api = component 'API'
      legacy = component 'Legacy' {
        db = component 'DB'
      }
    }
    customer -> cloud.api 'uses'
    customer -> cloud.legacy 'uses legacy'
  }
  views {
    view index {
      include *
    }
    view cloud of cloud {
      include *
    }
    view payments {
      include customer, cloud.payments
    }
  }
`

const rfc = `
  diff rfc1 'Payments' {
    description 'Replace legacy with payments'
    remove {
      cloud.legacy
      customer -> cloud.api 'uses'
    }
    add {
      extend cloud {
        payments = component 'Payments'
      }
      customer -> cloud.payments 'pays'
      extend cloud.api {
        #next
      }
    }
  }
`

describe('Model Builder - Diff', () => {
  it('builds diffs without changing the model', async ({ expect }) => {
    const { addDocument, validateAll, buildLikeC4Model } = createTestServices()
    await addDocument(base)
    await addDocument(rfc)
    const { errors } = await validateAll()
    expect(errors).toEqual([])

    const model = await buildLikeC4Model()
    const diff = model.$data.diffs?.['rfc1' as never]
    expect(diff).toMatchObject({
      id: 'rfc1',
      title: 'Payments',
      description: { txt: 'Replace legacy with payments' },
      remove: {
        elements: ['cloud.legacy'],
      },
      modify: {
        elements: {
          'cloud.api': { tags: ['next'] },
        },
      },
    })
    expect(diff?.remove.relations).toHaveLength(1)
    expect(Object.keys(diff?.add.elements ?? {})).toEqual(['cloud.payments'])
    expect(Object.values(diff?.add.relations ?? {}).map(r => r.title)).toEqual(['pays'])

    expect(Object.keys(model.$data.elements)).not.toContain('cloud.payments')
    expect(model.$data.elements['cloud.api' as never]).not.toHaveProperty('tags')
  })

  it('merges a diff that spans several documents, in any order', async ({ expect }) => {
    const { addDocument, validateAll, buildLikeC4Model } = createTestServices()
    await addDocument(base)
    await addDocument(rfc)
    await addDocument(`
      diff rfc2 {
        add {
          extend cloud.cache {
            #next
            replica = component 'Replica'
          }
        }
      }
    `)
    await addDocument(`
      diff rfc2 {
        add {
          extend cloud {
            cache = component 'Front \\/ Back'
          }
        }
      }
    `)
    const { errors } = await validateAll()
    expect(errors).toEqual([])

    const model = await buildLikeC4Model()
    const added = model.$data.diffs?.['rfc2' as never]?.add.elements ?? {}
    expect(Object.keys(added)).toEqual(['cloud.cache', 'cloud.cache.replica'])
    expect(added['cloud.cache' as never]).toMatchObject({ title: 'Front / Back', tags: ['next'] })
  })

  it('computes views that reference elements added by a diff', async ({ expect }) => {
    const { validate, buildLikeC4Model } = createTestServices()
    await validate(base)
    await validate(rfc)
    const model = await buildLikeC4Model()
    const view = model.findView('payments')
    expect(view).not.toBeNull()
    expect([...view!.nodes()].map(n => n.id)).toEqual(['customer'])
  })

  it('reports relations that do not match the model', async ({ expect }) => {
    const { validate } = createTestServices()
    await validate(base)
    const { errors } = await validate(`
      diff stale {
        remove {
          customer -> cloud.api 'another title'
        }
      }
    `)
    expect(errors).toEqual([
      'No relation matches (by source, kind, target, title and direction). The model may have changed since the diff was written',
    ])
  })

  it('reports removal of unknown elements', async ({ expect }) => {
    const { validate } = createTestServices()
    await validate(base)
    const { errors } = await validate(`
      diff stale {
        remove {
          cloud.unknown
        }
      }
    `)
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('unknown')
  })

  it('reports removal of elements added by a diff', async ({ expect }) => {
    const { validate } = createTestServices()
    await validate(base)
    await validate(rfc)
    const { errors } = await validate(`
      diff second {
        remove {
          cloud.payments
        }
      }
    `)
    expect(errors).toEqual(['Element is added by diff "rfc1", it cannot be removed'])
  })

  it('reports relation extends inside diffs', async ({ expect }) => {
    const { validate } = createTestServices()
    await validate(base)
    const { errors } = await validate(`
      diff extendRelation {
        add {
          extend customer -> cloud.api 'uses' {
            #next
          }
        }
      }
    `)
    expect(errors).toContain('Diff cannot extend relations. Remove the relation and add a new one instead')
  })

  it('reports elements that already exist in the model', async ({ expect }) => {
    const { validate } = createTestServices()
    await validate(base)
    const { errors } = await validate(`
      diff duplicate {
        add {
          extend cloud {
            api = component 'API again'
          }
        }
      }
    `)
    expect(errors.some(e => e.startsWith('Duplicate element name'))).toBe(true)
  })

  it('formats diffs', async ({ expect }) => {
    const { format } = createTestServices()
    const formatted = await format(`
      specification {
        element component
      }
      model {
        a = component
        b = component
        a -> b
      }
      diff rfc 'Title' {
      description 'Why'
         remove {
      a -> b
          b
         }
          add {
        c = component 'C' {
      d = component
        }
       a -> c
         }
      }
    `)
    expect(formatted).toContain([
      `diff rfc 'Title' {`,
      `  description 'Why'`,
      `  remove {`,
      `    a -> b`,
      `    b`,
      `  }`,
      `  add {`,
      `    c = component 'C' {`,
      `      d = component`,
      `    }`,
      `    a -> c`,
      `  }`,
      `}`,
    ].join('\n'))
  })

  it('accepts diff keywords as names', async ({ expect }) => {
    const { validate } = createTestServices()
    const { errors } = await validate(`
      specification {
        element component
      }
      model {
        diff = component
        add = component
        remove = component
        add -> remove
      }
    `)
    expect(errors).toEqual([])
  })
})
