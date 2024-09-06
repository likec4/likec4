import { describe, expect, it } from 'vitest'
import { LikeC4 } from './LikeC4'

describe('LikeC4', () => {
  it('should parse single source', async ({ expect }) => {
    const likec4 = await LikeC4.fromSource(`
      specification {
        element component
        element user {
          style {
            shape person
          }
        }
      }
      model {
        customer = user 'Customer'
        component system {
          spa = component 'SPA' {
            style {
              shape browser
            }
          }
          mobile = component 'Mobile' {
            style {
              color green
              shape mobile
            }
          }
        }
        customer -> spa
        customer -> mobile
      }
      views {
        view index {
          include *
        }
      }
    `)
    expect(likec4.hasErrors()).toBe(false)

    const model = await likec4.model()
    expect(model.element('customer').outgoing()).toHaveLength(2)
    expect(model.element('system').children()).toHaveLength(2)
    expect(model.view('index').elements()).toHaveLength(2)
    expect(model.view('index').connections()).toHaveLength(1)
  })

  it('should not throw error if invalid', async ({ expect }) => {
    try {
      const likec4 = await LikeC4.fromSource(
        `
        specification {
          element component
        }
        model {
          customer = user 'Customer'
          component system
        }
      `,
        {
          printErrors: false,
          throwIfInvalid: false
        }
      )

      expect(likec4.hasErrors()).toBe(true)
    } catch (err) {
      expect.unreachable()
    }
  })

  it('should throw error if invalid', async ({ expect }) => {
    expect.hasAssertions()
    const promise = LikeC4.fromSource(
      `
      specification {
        element component
      }
      model {
        customer = user 'Customer'
        component system
      }
    `,
      {
        printErrors: false,
        throwIfInvalid: true
      }
    )

    await expect(promise).rejects.toThrow(`Invalid model:
  /workspace/source.likec4:5 Could not resolve reference to ElementKind named 'user'`)
  })
})
