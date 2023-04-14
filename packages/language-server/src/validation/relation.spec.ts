import { describe, expect, it } from 'vitest'
import { createTestServices } from '../test'


describe('relationChecks', () => {

  it('should not report invalid relations', async () => {
    const { validate } = createTestServices()
    const { errors } = await validate(`
      specification {
        element component
      }
      model {
        component c1 {
          component c2 {
            -> c3
          }
        }
        component c3 {
          this -> c1
        }
        c3 -> c2
      }
    `)
    expect(errors).toEqual([])
  })

  it('should report invalid relation: parent -> child', async () => {
    const { validate } = createTestServices()
    const { errors } = await validate(`
      specification {
        element component
      }
      model {
        component c1 {
          component c2 {
            component c3
          }
        }
        c1 -> c3
      }
    `)
    expect(errors).toEqual(['Invalid relation (same hierarchy)'])
  })

  it('should report invalid relation: -> nested child', async () => {
    const { validate } = createTestServices()
    const { errors } = await validate(`
      specification {
        element component
      }
      model {
        component c1 {
          component c2 {
            component c3
          }
          -> c3
        }
      }
    `)
    expect(errors).toEqual(['Invalid relation (same hierarchy)'])
  })

  it('should report invalid relation: child -> parent', async () => {
    const { validate } = createTestServices()
    const { errors } = await validate(`
      specification {
        element component
      }
      model {
        component c1 {
          component c2 {
            component c3
          }
        }
        c3 -> c2
      }
    `)
    expect(errors).toEqual(['Invalid relation (same hierarchy)'])
  })

  it('should report invalid relation: nested child -> parent', async () => {
    const { validate } = createTestServices()
    const { errors } = await validate(`
      specification {
        element component
      }
      model {
        component c1 {
          component c2 {
            component c3 {
              -> c1
            }
          }
        }
      }
    `)
    expect(errors).toEqual(['Invalid relation (same hierarchy)'])
  })
})
