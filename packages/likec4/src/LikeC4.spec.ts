import { describe, it } from 'vitest'
import { LikeC4 } from './LikeC4'

describe('LikeC4', () => {
  it('should parse source and build computed model', async ({ expect }) => {
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

    const model = likec4.computedModel()
    expect([...model.element('customer').outgoing()]).toHaveLength(2)
    expect([...model.element('system').children()]).toHaveLength(2)
    expect([...model.view('index').elements()]).toHaveLength(2)
    expect([...model.view('index').edges()]).toHaveLength(1)
  })

  it('should parse source and build layouted model', async ({ expect }) => {
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

    const model = await likec4.layoutedModel()
    expect([...model.element('customer').outgoing()]).toHaveLength(2)
    expect([...model.element('system').children()]).toHaveLength(2)
    expect([...model.element('system').children()]).toHaveLength(2)
    expect([...model.view('index').elements()]).toHaveLength(2)
    expect([...model.view('index').edges()]).toHaveLength(1)
    expect(model.view('index').node('system').$node).toMatchObject({
      width: expect.any(Number),
      height: expect.any(Number),
      position: expect.any(Array),
      labelBBox: {
        x: expect.any(Number),
        y: expect.any(Number),
        width: expect.any(Number),
        height: expect.any(Number)
      }
    })
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
