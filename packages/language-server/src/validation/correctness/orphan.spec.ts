import { describe, it } from 'vitest'
import { createTestServices } from '../../test'

describe('orphan checks', () => {
  it('should report orphaned elements when check-orphan tag is present', async ({ expect }) => {
    const { validate } = createTestServices()
    const { warnings } = await validate(`
      specification {
        element person
        element webapp
        element service
        relationship uses
        relationship calls
        tag check-orphan
      }
      model {
        person client
        webapp frontend
        service backend
        
        client .uses frontend
      }
    `)

    const orphanWarnings = warnings.filter(w => w.includes('is not connected to any other elements'))
    expect(orphanWarnings).toHaveLength(1)
    expect(orphanWarnings[0]).toBe('Element \'backend\' is not connected to any other elements')
  })

  it('should not report orphaned elements when check-orphan tag is not present', async ({ expect }) => {
    const { validate } = createTestServices()
    const { warnings } = await validate(`
      specification {
        element person
        element webapp
        element service
        relationship uses
        relationship calls
      }
      model {
        person client
        webapp frontend
        service backend
        
        client .uses frontend
      }
    `)

    const orphanWarnings = warnings.filter(w => w.includes('is not connected to any other elements'))
    expect(orphanWarnings).toHaveLength(0)
  })

  it('should not report user and external elements as orphaned', async ({ expect }) => {
    const { validate } = createTestServices()
    const { warnings } = await validate(`
      specification {
        element user
        element external
        element webapp
        relationship uses
        tag check-orphan
      }
      model {
        user client
        external thirdParty
        webapp frontend
        
        client .uses frontend
      }
    `)

    const orphanWarnings = warnings.filter(w => w.includes('is not connected to any other elements'))
    expect(orphanWarnings).toHaveLength(0)
  })
})
