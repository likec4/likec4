import { describe, it } from 'vitest'
import { createTestServices } from '../../test'

describe('cycle checks', () => {
  it('should report cyclic dependencies when check-cycle tag is present', async ({ expect }) => {
    const { validate } = createTestServices()
    const { warnings } = await validate(`
      specification {
        element service
        element database
        relationship calls
        relationship accesses
        tag check-cycle
      }
      model {
        service backend {
          service api
        }
        database db
        
        backend .calls api
        api .accesses db
        db .accesses backend
      }
    `)

    const cycleWarnings = warnings.filter(w => w.includes('Cyclic dependency detected'))
    expect(cycleWarnings).toHaveLength(1)
    expect(cycleWarnings[0]).toContain('Cyclic dependency detected')
  })

  it('should not report cyclic dependencies when check-cycle tag is not present', async ({ expect }) => {
    const { validate } = createTestServices()
    const { warnings } = await validate(`
      specification {
        element service
        element database
        relationship calls
        relationship accesses
      }
      model {
        service backend {
          service api
        }
        database db
        
        backend .calls api
        api .accesses db
        db .accesses backend
      }
    `)

    const cycleWarnings = warnings.filter(w => w.includes('Cyclic dependency detected'))
    expect(cycleWarnings).toHaveLength(0)
  })

  it('should not report acyclic dependencies', async ({ expect }) => {
    const { validate } = createTestServices()
    const { warnings } = await validate(`
      specification {
        element service
        element database
        relationship calls
        relationship accesses
        tag check-cycle
      }
      model {
        service backend {
          service api
        }
        database db
        
        backend .calls api
        api .accesses db
      }
    `)

    const cycleWarnings = warnings.filter(w => w.includes('Cyclic dependency detected'))
    expect(cycleWarnings).toHaveLength(0)
  })
})
