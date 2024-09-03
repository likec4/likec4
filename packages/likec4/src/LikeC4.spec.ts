import { describe, expect, it } from 'vitest'
import { LikeC4 } from './LikeC4'

describe('LikeC4', () => {
  it('should parse single source', async () => {
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
    const model = await likec4.model()
    expect(model.element('customer').outgoing()).toHaveLength(2)
    expect(model.element('system').children()).toHaveLength(2)
    expect(model.view('index').elements()).toHaveLength(2)
    expect(model.view('index').connections()).toHaveLength(1)
  })
})
