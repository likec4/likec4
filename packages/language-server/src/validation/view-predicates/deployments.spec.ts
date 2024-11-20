import { describe, it } from 'vitest'
import { createTestServices } from '../../test'

describe.concurrent('DeploymentRefExpressionChecks', () => {
  const model = `
    specification {
      element component
      deploymentNode node
    }
    model {
      component c1 {
        component c2
      }
    }
    deployment {
      node n1 {
        instanceOf c1
      }
    }
  `
  it('should not warn', async ({ expect }) => {
    const { validate } = createTestServices()
    const { errors } = await validate(`${model}
      views {
        deployment view dep1 {
          include n1.c1
        }
      }
    `)
    expect(errors).toEqual([])
  })

  it('should error if include element', async ({ expect }) => {
    const { validate } = createTestServices()
    const { errors } = await validate(`${model}
      views {
        deployment view dep1 {
          include n1.c1.c2
        }
      }
    `)
    expect(errors).toHaveLength(1)
    expect(errors).toEqual(['Invalid reference, deployment nodes and instances are only allowed'])
  })

  it('should error if expand element', async ({ expect }) => {
    const { validate } = createTestServices()
    const { errors } = await validate(`${model}
      views {
        deployment view dep1 {
          include n1.c1.c2._
        }
      }
    `)
    expect(errors).toEqual([
      'Invalid reference, deployment nodes and instances are only allowed'
    ])
  })

  it('should error if expand instance', async ({ expect }) => {
    const { validate } = createTestServices()
    const { errors } = await validate(`${model}
      views {
        deployment view dep1 {
          include n1.c1._
        }
      }
    `)
    expect(errors).toEqual(['Only deployment nodes can be expanded'])
  })

  it('should not warn if expand node', async ({ expect }) => {
    const { validate } = createTestServices()
    const { errors } = await validate(`${model}
      views {
        deployment view dep1 {
          include n1._
        }
      }
    `)
    expect(errors).toEqual([])
  })

  it('should error if _.* element', async ({ expect }) => {
    const { validate } = createTestServices()
    const { errors } = await validate(`${model}
      views {
        deployment view dep1 {
          include n1.c1.c2.*
        }
      }
    `)
    expect(errors).toEqual([
      'Invalid reference, deployment nodes and instances are only allowed'
    ])
  })

  it('should error if _.* instance', async ({ expect }) => {
    const { validate } = createTestServices()
    const { errors } = await validate(`${model}
      views {
        deployment view dep1 {
          include n1.c1.*
        }
      }
    `)
    expect(errors).toEqual(['Only deployment nodes can be expanded'])
  })

  it('should not warn if _.* node', async ({ expect }) => {
    const { validate } = createTestServices()
    const { errors } = await validate(`${model}
      views {
        deployment view dep1 {
          include n1.*
        }
      }
    `)
    expect(errors).toEqual([])
  })
})
