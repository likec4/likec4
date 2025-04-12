import { describe, it } from 'vitest'
import { createTestServices } from '../../test'

describe('LikeC4ModelBuilder - extend element', () => {
  it('build model returns cached result', async ({ expect }) => {
    const { validate, buildLikeC4Model } = createTestServices()
    await validate(`
      specification {
        element component
        tag tag1
        tag tag2
        tag tag3
      }
      model {
        component system {
          sub = component {
            #tag1
          }
        }
      }
    `)
    await validate(`
      model {
        extend system.sub {
          #tag2
        }
      }
    `)
    await validate(`
      model {
        extend system.sub {
          #tag1, #tag3
        }
      }
    `)

    const model = await buildLikeC4Model()
    const systemSub = model.element('system.sub')
    expect(systemSub.tags).toEqual(['tag1', 'tag2', 'tag3'])
  })
})
