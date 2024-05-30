import { describe, it, vi } from 'vitest'
import { createTestServices } from '../test'

vi.mock('../logger')

describe.concurrent('relationChecks', () => {
  it('should not report invalid relations', async ({ expect }) => {
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

  it('should report invalid relation of target', async ({ expect }) => {
    const { validate } = createTestServices()
    const { errors } = await validate(`
      specification {
        element component
      }
      model {
        component c1 {
        }
        c1 -> c2
      }
    `)
    expect(errors).to.include.members(['Target not found (not parsed/indexed yet)'])
  })

  it('should report invalid relation of source', async ({ expect }) => {
    const { validate } = createTestServices()
    const { errors } = await validate(`
      specification {
        element component
      }
      model {
        component c1 {
        }
        c2 -> c1
      }
    `)
    expect(errors).to.include.members(['Source not found (not parsed/indexed yet)'])
  })

  it('should report invalid relation: parent -> child', async ({ expect }) => {
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
    expect(errors).toEqual(['Invalid parent-child relationship'])
  })

  it('should report invalid relation: -> nested child', async ({ expect }) => {
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
    expect(errors).toEqual(['Invalid parent-child relationship'])
  })

  it('should report invalid relation: child -> parent', async ({ expect }) => {
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
    expect(errors).toEqual(['Invalid parent-child relationship'])
  })

  it('should report invalid relation: nested child -> parent', async ({ expect }) => {
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
    expect(errors).toEqual(['Invalid parent-child relationship'])
  })

  it('should not report for valid tags', async ({ expect }) => {
    const { validate } = createTestServices()
    const { errors } = await validate(`
      specification {
        element component
        tag one
      }
      model {
        component c1
        component c2
        c1 -> c2 #one
        c2 -> c1 {
          #one
        }
      }
    `)
    expect(errors).toEqual([])
  })

  it('should report invalid tags', async ({ expect }) => {
    const { validate } = createTestServices()
    const { errors } = await validate(`
      specification {
        element component
        tag one
      }
      model {
        component c1
        component c2
        c1 -> c2 #one {
          #one
        }
      }
    `)
    expect(errors).toEqual(['Relation cannot have tags in both header and body'])
  })
})
