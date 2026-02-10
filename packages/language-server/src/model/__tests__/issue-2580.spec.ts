import { describe, it } from 'vitest'
import { createTestServices } from '../../test'

// https://github.com/likec4/likec4/issues/2580
describe('Issue 2580 - Title of specified element can not be overridden in model', () => {
  describe('parsed data', () => {
    it('should set title from the model', async ({ expect }) => {
      const { validate, buildModel } = createTestServices()
      await validate(`
      specification {
        element system {
          title "System Element"
        }
      }
      model {
        // title equals to name
        shareVote = system {
          title "shareVote"
        }

        // title not equals to name
        s2 = system {
          title "shareVote2"
        }
      }
    `)

      const { elements } = await buildModel()
      expect(elements).toHaveProperty('shareVote')
      expect(elements['shareVote']).toHaveProperty('title', 'shareVote')

      expect(elements).toHaveProperty('s2')
      expect(elements['s2']).toHaveProperty('title', 'shareVote2')
    })
  })

  describe('computed model', () => {
    it('should set title from the computed model', async ({ expect }) => {
      const { validate, buildLikeC4Model } = createTestServices()
      await validate(`
      specification {
        element system {
          title "System Element"
        }
      }
      model {
        // title equals to name
        shareVote = system {
          title "shareVote"
        }

        // title not equals to name
        s2 = system {
          title "shareVote2"
        }
      }
    `)

      const model = await buildLikeC4Model()

      const el = model.element('shareVote')
      expect(el.kind).toBe('system')
      expect(el.title).toBe('shareVote')

      const el2 = model.element('s2')
      expect(el2.kind).toBe('system')
      expect(el2.title).toBe('shareVote2')
    })
  })

  it('should ignore empty title in specification', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    await validate(`
      specification {
        element system {
          title ""
        }
      }
      model {      
        testsys = system
      }
    `)

    const { elements } = await buildModel()
    expect(elements).toHaveProperty('testsys')
    expect(elements['testsys']).toHaveProperty('title', 'testsys')
  })

  it('should ignore empty title in model', async ({ expect }) => {
    const { validate, buildModel } = createTestServices()
    await validate(`
      specification {
        element system {
          title "SpecTitle"
        }
      }
      model {      
        testsys1 = system
        testsys2 = system {
          title ""
        }
      }
    `)

    const { elements } = await buildModel()
    expect(elements).toHaveProperty('testsys1')
    expect(elements['testsys1']).toHaveProperty('title', 'SpecTitle')

    expect(elements).toHaveProperty('testsys2')
    expect(elements['testsys2']).toHaveProperty('title', 'SpecTitle')
  })
})
