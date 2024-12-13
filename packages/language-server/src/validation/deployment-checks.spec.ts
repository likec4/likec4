import { describe, it } from 'vitest'
import { createTestServices } from '../test'

describe.concurrent('deployment relations check', () => {
  const model = `
    specification {
      element component
      deploymentNode node
    }
    model {
      component a1 {
        component a2
      }
    }
    deployment {
      node n1 {
        instanceOf a1
        node n2 {
          instanceOf a2
        }
      }
    }
  `

  it('should not report invalid relation', async ({ expect }) => {
    const { validate } = createTestServices()
    const { errors } = await validate(`${model}
      deployment {
        a1.a2 -> n2.a2
        n1.a1 -> n2.a2
      }
    `)
    expect(errors).toEqual([])
  })

  // it('should report invalid relation between nodes and instance internals (source)', async ({ expect }) => {
  //   const { validate } = createTestServices()
  //   const { errors } = await validate(`${model}
  //     deployment {
  //       a1.a2 -> n1
  //     }
  //   `)
  //   expect(errors).toEqual([
  //     'Relations between deployment nodes and instance internals are not supported'
  //   ])
  // })

  // it('should report invalid relation between nodes and instance internals (target)', async ({ expect }) => {
  //   const { validate } = createTestServices()
  //   const { errors } = await validate(`${model}
  //     deployment {
  //       n2 -> a1.a2
  //     }
  //   `)
  //   expect(errors).toEqual([
  //     'Relations between deployment nodes and instance internals are not supported'
  //   ])
  // })

  it('should report invalid relation: parent -> child', async ({ expect }) => {
    const { validate } = createTestServices()
    const { errors } = await validate(`${model}
      deployment {
        n1 -> n2
      }
    `)
    expect(errors).toEqual([
      'Invalid parent-child relationship'
    ])
  })

  it('should report invalid relation: child -> parent', async ({ expect }) => {
    const { validate } = createTestServices()
    const { errors } = await validate(`${model}
      deployment {
        n2.a2 -> n1
      }
    `)
    expect(errors).toEqual([
      'Invalid parent-child relationship'
    ])
  })
})
