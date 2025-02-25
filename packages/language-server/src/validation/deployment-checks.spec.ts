import { describe, it } from 'vitest'
import { createTestServices } from '../test'

describe.concurrent('deployment checks', () => {
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

  describe('deployment relations checks', () => {
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

    it('should report invalid relation: parent -> child', async ({ expect }) => {
      const { validate } = createTestServices()
      const { errors } = await validate(`${model}
      deployment {
        n1 -> n2
      }
    `)
      expect(errors).toEqual([
        'Invalid parent-child relationship',
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
        'Invalid parent-child relationship',
      ])
    })
  })

  describe('extend deployment checks', () => {
    it('should not report valid target', async ({ expect }) => {
      const { validate } = createTestServices()
      const { errors } = await validate(`${model}
        deployment {
          extend n1.n2 {
          }
        }
      `)
      expect(errors).toEqual([])
    })

    it('should report invalid target - expects fully-qualified-name', async ({ expect }) => {
      const { validate } = createTestServices()
      const { errors } = await validate(`${model}
        deployment {
          extend n2 {
          }
        }
      `)
      expect(errors).toEqual([
        `Could not resolve reference to Referenceable named 'n2'.`,
        'ExtendDeployment allows only DeploymentNode',
      ])
    })

    it('should report invalid target - deployed instance', async ({ expect }) => {
      const { validate } = createTestServices()
      const { errors } = await validate(`${model}
        deployment {
          extend n1.a1 {
          }
        }
      `)
      expect(errors).toEqual([
        `Could not resolve reference to Referenceable named 'a1'.`,
        'ExtendDeployment allows only DeploymentNode',
      ])
    })
  })
})
