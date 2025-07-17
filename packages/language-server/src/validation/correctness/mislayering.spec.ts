import { describe, it } from 'vitest'
import { createTestServices } from '../../test'

describe('mislayering checks', () => {
  it('should report mislayered relationships', async ({ expect }) => {
    const { validate } = createTestServices()
    const { warnings } = await validate(`
      specification {
        element person
        element webapp
        element service
        element database
        relationship uses
        relationship calls
        relationship accesses
        tag check-mislayering
      }
      model {
        person client {
          metadata {
            layer '1'
          }
        }
        webapp frontend {
          metadata {
            layer '2'
          }
        }
        service backend {
          metadata {
            layer '3'
          }
        }
        database db {
          metadata {
            layer '4'
          }
        }
        
        client .uses frontend
        frontend .calls backend
        client .accesses db
      }
    `)

    const mislayeringWarnings = warnings.filter(w => w.includes('connects non-adjacent layers'))
    expect(mislayeringWarnings).toHaveLength(1)
    expect(mislayeringWarnings[0]).toBe('Relationship \'client -> db\' connects non-adjacent layers (1 -> 4)')
  })

  it('should not report adjacent layer relationships', async ({ expect }) => {
    const { validate } = createTestServices()
    const { warnings } = await validate(`
      specification {
        element person
        element webapp
        element service
        relationship uses
        relationship calls
        tag check-mislayering
      }
      model {
        person client {
          metadata {
            layer '1'
          }
        }
        webapp frontend {
          metadata {
            layer '2'
          }
        }
        service backend {
          metadata {
            layer '3'
          }
        }
        
        client .uses frontend
        frontend .calls backend
      }
    `)

    const mislayeringWarnings = warnings.filter(w => w.includes('connects non-adjacent layers'))
    expect(mislayeringWarnings).toHaveLength(0)
  })

  it('should report elements without layer info when check-mislayering tag is present', async ({ expect }) => {
    const { validate } = createTestServices()
    const { warnings } = await validate(`
      specification {
        element person
        element webapp
        element service
        relationship uses
        relationship calls
        tag check-mislayering
      }
      model {
        person client
        webapp frontend {
          metadata {
            layer '2'
          }
        }
        service backend
      }
    `)

    const layerInfoWarnings = warnings.filter(w => w.includes('does not have layer information defined'))
    expect(layerInfoWarnings).toHaveLength(2)
    expect(layerInfoWarnings).toContain('Element \'client\' does not have layer information defined')
    expect(layerInfoWarnings).toContain('Element \'backend\' does not have layer information defined')
  })

  it('should not report elements without layer info when check-mislayering tag is not present', async ({ expect }) => {
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
        webapp frontend {
          metadata {
            layer '2'
          }
        }
        service backend
      }
    `)

    const layerInfoWarnings = warnings.filter(w => w.includes('does not have layer information defined'))
    expect(layerInfoWarnings).toHaveLength(0)
  })

  it('should not report mislayered relationships when check-mislayering tag is not present', async ({ expect }) => {
    const { validate } = createTestServices()
    const { warnings } = await validate(`
      specification {
        element person
        element webapp
        element service
        element database
        relationship uses
        relationship calls
        relationship accesses
      }
      model {
        person client {
          metadata {
            layer '1'
          }
        }
        webapp frontend {
          metadata {
            layer '2'
          }
        }
        service backend {
          metadata {
            layer '3'
          }
        }
        database db {
          metadata {
            layer '4'
          }
        }
        
        client .uses frontend
        frontend .calls backend
        client .accesses db
      }
    `)

    const mislayeringWarnings = warnings.filter(w => w.includes('connects non-adjacent layers'))
    expect(mislayeringWarnings).toHaveLength(0)
  })

  it('should handle elements with invalid layer values', async ({ expect }) => {
    const { validate } = createTestServices()
    const { warnings } = await validate(`
      specification {
        element person
        element webapp
        relationship uses
        tag check-mislayering
      }
      model {
        person client {
          metadata {
            layer 'invalid'
          }
        }
        webapp frontend {
          metadata {
            layer '2'
          }
        }
        
        client .uses frontend
      }
    `)

    // Should report that client doesn't have valid layer info
    const layerInfoWarnings = warnings.filter(w => w.includes('does not have layer information defined'))
    expect(layerInfoWarnings).toHaveLength(1)
    expect(layerInfoWarnings[0]).toBe('Element \'client\' does not have layer information defined')
  })
})
