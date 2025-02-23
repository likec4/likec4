import {
  type Fqn,
} from '@likec4/core'
import { pick } from 'remeda'
import { type ExpectStatic, describe, it } from 'vitest'
import type { LikeC4Services } from '../module'
import { createTestServices } from '../test'

function asserts(services: LikeC4Services, expect: ExpectStatic) {
  return {
    expectDirectChildrenOf(fqn: string) {
      const children = services.likec4.FqnIndex.directChildrenOf(fqn as Fqn).toArray().map(({ name, id }) => ({
        name,
        fqn: id,
      }))
      return expect(children)
    },
    expectDescendantsOf(fqn: string) {
      const children = services.likec4.FqnIndex.uniqueDescedants(fqn as Fqn).toArray().map(({ name, id }) => ({
        name,
        fqn: id,
      }))
      return expect(children)
    },
  }
}

describe('Fqn Index', () => {
  it('one document - one level', async ({ expect }) => {
    const { parse, services } = createTestServices()
    const { expectDirectChildrenOf, expectDescendantsOf } = asserts(services, expect)
    await parse(`
        specification {
          element component
        }
        model {
          component c1 {
            component c2
            component c2
            component c3
          }
        }
      `)

    expectDirectChildrenOf('c1').toEqual([
      { name: 'c3', fqn: 'c1.c3' },
    ])
    expectDescendantsOf('c1').toEqual([
      { name: 'c3', fqn: 'c1.c3' },
    ])
  })

  it('one document - more levels', async ({ expect }) => {
    const { parse, services } = createTestServices()
    const { expectDirectChildrenOf, expectDescendantsOf } = asserts(services, expect)
    await parse(`
        specification {
          element component
        }
        model {
          component c1 {
            component c2_1 {
              component c3_1
              component c3_2
            }
            component c2_2 {
              component c3_2
              component c3_3
            }
          }
        }
      `)
    expectDirectChildrenOf('c1').toEqual([
      { name: 'c2_1', fqn: 'c1.c2_1' },
      { name: 'c2_2', fqn: 'c1.c2_2' },
    ])
    expectDescendantsOf('c1').toEqual([
      { name: 'c2_1', fqn: 'c1.c2_1' },
      { name: 'c2_2', fqn: 'c1.c2_2' },
      { name: 'c3_1', fqn: 'c1.c2_1.c3_1' },
      // duplicate
      // { name: 'c3_2', fqn: 'c1.c2_1.c3_2' },
      { name: 'c3_3', fqn: 'c1.c2_2.c3_3' },
    ])

    expectDirectChildrenOf('c1.c2_1').toEqual([
      { name: 'c3_1', fqn: 'c1.c2_1.c3_1' },
      { name: 'c3_2', fqn: 'c1.c2_1.c3_2' },
    ])
    expectDescendantsOf('c1.c2_1').toEqual([
      { name: 'c3_1', fqn: 'c1.c2_1.c3_1' },
      { name: 'c3_2', fqn: 'c1.c2_1.c3_2' },
    ])

    expectDirectChildrenOf('c1.c2_2').toEqual([
      { name: 'c3_2', fqn: 'c1.c2_2.c3_2' },
      { name: 'c3_3', fqn: 'c1.c2_2.c3_3' },
    ])
    expectDescendantsOf('c1.c2_2').toEqual([
      { name: 'c3_2', fqn: 'c1.c2_2.c3_2' },
      { name: 'c3_3', fqn: 'c1.c2_2.c3_3' },
    ])
  })

  it('extend element', async ({ expect }) => {
    const { parse, services } = createTestServices()
    const { expectDirectChildrenOf, expectDescendantsOf } = asserts(services, expect)
    await parse(`
        specification {
          element component
        }
        model {
          component c1 {
            component c2
            component duplicate {
              component d1
            }
          }
        }
      `)
    expectDirectChildrenOf('c1').toEqual([
      { name: 'c2', fqn: 'c1.c2' },
      { name: 'duplicate', fqn: 'c1.duplicate' },
    ])
    expectDescendantsOf('c1').toEqual([
      { name: 'c2', fqn: 'c1.c2' },
      { name: 'duplicate', fqn: 'c1.duplicate' },
      { name: 'd1', fqn: 'c1.duplicate.d1' },
    ])

    await parse(`
        model {
          extend c1 {
            component c3
            component duplicate {
              component d2
            }
            // bubble up
            component d1
          }
        }
      `)
    expectDirectChildrenOf('c1').toEqual([
      { name: 'c2', fqn: 'c1.c2' },
      { name: 'c3', fqn: 'c1.c3' },
      { name: 'd1', fqn: 'c1.d1' },
    ])
    expectDescendantsOf('c1').toEqual([
      { name: 'c2', fqn: 'c1.c2' },
      { name: 'c3', fqn: 'c1.c3' },
      { name: 'd1', fqn: 'c1.d1' },
      { name: 'd2', fqn: 'c1.duplicate.d2' },
    ])
  })

  it('extend element (multiple)', async ({ expect }) => {
    const { parse, services } = createTestServices()
    const { expectDirectChildrenOf, expectDescendantsOf } = asserts(services, expect)
    await parse(`
        specification {
          element component
        }
        model {
          component c1 {
            component c2
          }
        }
      `)
    await parse(`
         model {
          extend c1.c2.c3 {
            component c4
          }
          extend c1.c2 {
            component c5
          }
        }
      `)
    await parse(`
         model {
          extend c1.c2 {
            component c3
          }
        }
      `)
    expectDirectChildrenOf('c1').toEqual([
      { name: 'c2', fqn: 'c1.c2' },
    ])
    expectDirectChildrenOf('c1.c2').toEqual([
      { name: 'c3', fqn: 'c1.c2.c3' },
      { name: 'c5', fqn: 'c1.c2.c5' },
    ])
    expectDescendantsOf('c1').toEqual([
      { name: 'c2', fqn: 'c1.c2' },
      { name: 'c3', fqn: 'c1.c2.c3' },
      { name: 'c5', fqn: 'c1.c2.c5' },
      { name: 'c4', fqn: 'c1.c2.c3.c4' },
    ])
    expectDescendantsOf('c1.c2').toEqual([
      { name: 'c3', fqn: 'c1.c2.c3' },
      { name: 'c5', fqn: 'c1.c2.c5' },
      { name: 'c4', fqn: 'c1.c2.c3.c4' },
    ])
  })
})
