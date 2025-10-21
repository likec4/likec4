import { describe, it } from 'vitest'
import { createTestServices } from '../../test'

describe('LikeC4ModelBuilder - extend element with metadata', () => {
  it('extends element with simple metadata', async ({ expect }) => {
    const { validate, buildLikeC4Model } = createTestServices()
    await validate(`
      specification {
        element component
      }
      model {
        component system {
          metadata {
            version '1.0.0'
          }
        }
      }
    `)
    await validate(`
      model {
        extend system {
          metadata {
            owner 'team-a'
          }
        }
      }
    `)

    const model = await buildLikeC4Model()
    const system = model.element('system')
    expect(system.getMetadata()).toEqual({
      version: '1.0.0',
      owner: 'team-a',
    })
  })

  it('merges duplicate metadata keys from extend', async ({ expect }) => {
    const { validate, buildLikeC4Model } = createTestServices()
    await validate(`
      specification {
        element component
      }
      model {
        component system {
          metadata {
            tags 'backend'
          }
        }
      }
    `)
    await validate(`
      model {
        extend system {
          metadata {
            tags 'api'
          }
        }
      }
    `)

    const model = await buildLikeC4Model()
    const system = model.element('system')
    expect(system.getMetadata()).toEqual({
      tags: ['backend', 'api'],
    })
  })

  it('merges array metadata from extend', async ({ expect }) => {
    const { validate, buildLikeC4Model } = createTestServices()
    await validate(`
      specification {
        element component
      }
      model {
        component system {
          metadata {
            regions ['us-east-1', 'us-west-2']
          }
        }
      }
    `)
    await validate(`
      model {
        extend system {
          metadata {
            regions ['eu-west-1', 'ap-south-1']
          }
        }
      }
    `)

    const model = await buildLikeC4Model()
    const system = model.element('system')
    expect(system.getMetadata()).toEqual({
      regions: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-south-1'],
    })
  })

  it('merges string and array metadata', async ({ expect }) => {
    const { validate, buildLikeC4Model } = createTestServices()
    await validate(`
      specification {
        element component
      }
      model {
        component system {
          metadata {
            tags 'backend'
          }
        }
      }
    `)
    await validate(`
      model {
        extend system {
          metadata {
            tags ['api', 'microservice']
          }
        }
      }
    `)

    const model = await buildLikeC4Model()
    const system = model.element('system')
    expect(system.getMetadata()).toEqual({
      tags: ['backend', 'api', 'microservice'],
    })
  })

  it('deduplicates duplicate values in merged metadata', async ({ expect }) => {
    const { validate, buildLikeC4Model } = createTestServices()
    await validate(`
      specification {
        element component
      }
      model {
        component system {
          metadata {
            tags ['backend', 'api']
          }
        }
      }
    `)
    await validate(`
      model {
        extend system {
          metadata {
            tags ['api', 'microservice', 'backend']
          }
        }
      }
    `)

    const model = await buildLikeC4Model()
    const system = model.element('system')
    expect(system.getMetadata()).toEqual({
      tags: ['backend', 'api', 'microservice'],
    })
  })

  it('converts single-value array to string after deduplication', async ({ expect }) => {
    const { validate, buildLikeC4Model } = createTestServices()
    await validate(`
      specification {
        element component
      }
      model {
        component system {
          metadata {
            environment 'production'
          }
        }
      }
    `)
    await validate(`
      model {
        extend system {
          metadata {
            environment 'production'
          }
        }
      }
    `)

    const model = await buildLikeC4Model()
    const system = model.element('system')
    expect(system.getMetadata()).toEqual({
      environment: 'production',
    })
  })

  it('merges metadata from multiple extends', async ({ expect }) => {
    const { validate, buildLikeC4Model } = createTestServices()
    await validate(`
      specification {
        element component
      }
      model {
        component system {
          metadata {
            version '1.0.0'
            tags 'backend'
          }
        }
      }
    `)
    await validate(`
      model {
        extend system {
          metadata {
            tags 'api'
            owner 'team-a'
          }
        }
      }
    `)
    await validate(`
      model {
        extend system {
          metadata {
            tags 'microservice'
            regions 'us-east-1'
          }
        }
      }
    `)

    const model = await buildLikeC4Model()
    const system = model.element('system')
    expect(system.getMetadata()).toEqual({
      version: '1.0.0',
      tags: ['backend', 'api', 'microservice'],
      owner: 'team-a',
      regions: 'us-east-1',
    })
  })

  it('handles complex metadata merging with mixed types', async ({ expect }) => {
    const { validate, buildLikeC4Model } = createTestServices()
    await validate(`
      specification {
        element component
      }
      model {
        component system {
          metadata {
            version '1.0.0'
            tags ['backend', 'critical']
            regions 'us-east-1'
            ports ['8080']
          }
        }
      }
    `)
    await validate(`
      model {
        extend system {
          metadata {
            tags 'api'
            regions ['eu-west-1', 'ap-south-1']
            ports ['9090', '3000']
            owner 'team-a'
          }
        }
      }
    `)

    const model = await buildLikeC4Model()
    const system = model.element('system')
    expect(system.getMetadata()).toEqual({
      version: '1.0.0',
      tags: ['backend', 'critical', 'api'],
      regions: ['us-east-1', 'eu-west-1', 'ap-south-1'],
      ports: ['8080', '9090', '3000'],
      owner: 'team-a',
    })
  })

  it('extends nested element with metadata', async ({ expect }) => {
    const { validate, buildLikeC4Model } = createTestServices()
    await validate(`
      specification {
        element component
      }
      model {
        component cloud {
          component api {
            metadata {
              version '1.0.0'
            }
          }
        }
      }
    `)
    await validate(`
      model {
        extend cloud.api {
          metadata {
            tags 'backend'
          }
        }
      }
    `)

    const model = await buildLikeC4Model()
    const api = model.element('cloud.api')
    expect(api.getMetadata()).toEqual({
      version: '1.0.0',
      tags: 'backend',
    })
  })

  it('merges metadata across multiple documents', async ({ expect }) => {
    const { addDocument, buildLikeC4Model, validateAll } = createTestServices()

    await addDocument(`
      specification {
        element component
      }
      model {
        component api {
          metadata {
            version '2.0.0'
            tags 'backend'
          }
        }
      }
    `)

    await addDocument(`
      model {
        extend api {
          metadata {
            tags 'rest'
            owner 'platform-team'
          }
        }
      }
    `)

    await addDocument(`
      model {
        extend api {
          metadata {
            tags 'microservice'
            regions ['us', 'eu']
          }
        }
      }
    `)

    const { errors } = await validateAll()
    expect(errors).toEqual([])

    const model = await buildLikeC4Model()
    const api = model.element('api')
    expect(api.getMetadata()).toEqual({
      version: '2.0.0',
      tags: ['backend', 'rest', 'microservice'],
      owner: 'platform-team',
      regions: ['us', 'eu'],
    })
  })
})
