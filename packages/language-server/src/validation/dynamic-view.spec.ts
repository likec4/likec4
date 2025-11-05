import { describe, it } from 'vitest'
import { createTestServices } from '../test'

describe.concurrent('DynamicView Checks', () => {
  describe('stepChecks', () => {
    it('should not report invalid relations', async ({ expect }) => {
      const { validate } = createTestServices()
      const { errors } = await validate(`
      specification {
        element component
      }
      model {
        component c1
        component c2
      }
      views {
        dynamic view index {
          c1 -> c2
          c1 <- c2
        }
      }
    `)
      expect(errors).toEqual([])
    })

    it('should report invalid step target', async ({ expect }) => {
      const { validate } = createTestServices()
      const { errors } = await validate(`
      specification {
        element component
      }
      model {
        component c1
      }
      views {
        dynamic view {
          c1 -> c2
        }
      }
    `)
      expect(errors).to.include.members(['Target not found (not parsed/indexed yet)'])
    })

    it('should report invalid step source', async ({ expect }) => {
      const { validate } = createTestServices()
      const { errors } = await validate(`
      specification {
        element component
      }
      model {
        component c1
      }
      views {
        dynamic view index {
          c2 -> c1
        }
      }
    `)
      expect(errors).to.include.members(['Source not found (not parsed/indexed yet)'])
    })

    it('should report invalid step: -> nested child', async ({ expect }) => {
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
      }
      views {
        dynamic view index {
          c1 -> c3
        }
      }
    `)
      expect(errors).toEqual(['Invalid parent-child relationship'])
    })

    it('should report invalid step: child -> parent', async ({ expect }) => {
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
      }
      views {
        dynamic view index {
          c3 -> c1
        }
      }
    `)
      expect(errors).toEqual(['Invalid parent-child relationship'])
    })

    it('should report invalid step: A <- B -> C', async ({ expect }) => {
      const { validate } = createTestServices()
      const { errors } = await validate(`
      specification {
        element component
      }
      model {
        component A
        component B
        component C
      }
      views {
        dynamic view index {
          A <- B -> C
        }
      }
    `)
      expect(errors).toEqual(['Invalid chain after backward step'])
    })

    it('should not report self-reference (loop)', async ({ expect }) => {
      const { validate } = createTestServices()
      const { errors } = await validate(`
      specification {
        element component
      }
      model {
        component c1 {
          component c2
        }
      }
      views {
        dynamic view index {
          c2 -> c2
        }
      }
    `)
      expect(errors).toHaveLength(0)
    })
  })

  describe('display variant', () => {
    it('should report if invalid mode', async ({ expect }) => {
      const { validate } = createTestServices()
      const { errors } = await validate(`
      specification {
        element component
      }
      views {
        dynamic view index {
          variant invalid
        }
      }
    `)
      expect(errors).to.include.members(['Invalid display variant: "diagram" or "sequence" are allowed'])
    })

    it('should not report for valid modes', async ({ expect }) => {
      const { validate } = createTestServices()
      const { errors } = await validate(`
      specification {
        element component
      }
      views {
        dynamic view index {
          variant sequence
        }
        dynamic view index2 {
          variant diagram
        }
      }
    `)
      expect(errors).toHaveLength(0)
    })
  })

  describe('branch collection validation', () => {
    it('should report empty branch collection', async ({ expect }) => {
      const { validate } = createTestServices()
      const { errors } = await validate(`
      specification {
        element component
      }
      model {
        component A
        component B
      }
      views {
        dynamic view index {
          parallel {
          }
        }
      }
    `)
      expect(errors).to.include.members(['Parallel block has no paths or steps'])
    })

    it('should warn on degenerate single-path parallel', async ({ expect }) => {
      const { validate } = createTestServices()
      const { warnings } = await validate(`
      specification {
        element component
      }
      model {
        component A
        component B
      }
      views {
        dynamic view index {
          parallel {
            path only {
              A -> B
            }
          }
        }
      }
    `)
      expect(warnings).to.include.members([
        'Parallel block with only one path has no branching value. Consider removing the parallel wrapper.',
      ])
    })

    it('should warn on degenerate single-step alternate', async ({ expect }) => {
      const { validate } = createTestServices()
      const { warnings } = await validate(`
      specification {
        element component
      }
      model {
        component A
        component B
      }
      views {
        dynamic view index {
          alternate {
            A -> B
          }
        }
      }
    `)
      expect(warnings).to.include.members([
        'Alternate block with only one path has no branching value. Consider removing the alternate wrapper.',
      ])
    })

    it('should report nested homogeneous parallel (P-in-P)', async ({ expect }) => {
      const { validate } = createTestServices()
      const { errors } = await validate(`
      specification {
        element component
      }
      model {
        component A
        component B
        component C
      }
      views {
        dynamic view index {
          parallel {
            path outer {
              parallel {
                path inner1 { A -> B }
                path inner2 { B -> C }
              }
            }
          }
        }
      }
    `)
      expect(errors).to.include.members([
        'Nested parallel inside parallel with no other steps is not allowed. Parallel blocks are associative - flatten inner parallel paths into the parent parallel.',
      ])
    })

    it('should allow sequential parallel (has other steps)', async ({ expect }) => {
      const { validate } = createTestServices()
      const { errors } = await validate(`
      specification {
        element component
      }
      model {
        component A
        component B
        component C
      }
      views {
        dynamic view index {
          parallel {
            path outer {
              A -> B
              parallel {
                path inner1 { B -> C }
                path inner2 { B -> A }
              }
            }
          }
        }
      }
    `)
      expect(errors).toHaveLength(0)
    })

    it('should allow heterogeneous nesting (alternate in parallel)', async ({ expect }) => {
      const { validate } = createTestServices()
      const { errors } = await validate(`
      specification {
        element component
      }
      model {
        component A
        component B
        component C
      }
      views {
        dynamic view index {
          parallel {
            path option1 {
              alternate {
                path success { A -> B }
                path failure { A -> C }
              }
            }
            path option2 { B -> C }
          }
        }
      }
    `)
      expect(errors).toHaveLength(0)
    })

    it('should hint on nested homogeneous alternate (A-in-A)', async ({ expect }) => {
      const { validate } = createTestServices()
      const { hints } = await validate(`
      specification {
        element component
      }
      model {
        component A
        component B
        component C
      }
      views {
        dynamic view index {
          alternate {
            path outer {
              alternate {
                path inner1 { A -> B }
                path inner2 { B -> C }
              }
            }
          }
        }
      }
    `)
      expect(hints).to.include.members([
        'Nested alternate inside alternate with no other steps can be flattened. Alternate blocks are associative - consider using sibling paths instead.',
      ])
    })

    it('should allow sequential alternate', async ({ expect }) => {
      const { validate } = createTestServices()
      const { errors } = await validate(`
      specification {
        element component
      }
      model {
        component A
        component B
        component C
        component D
      }
      views {
        dynamic view index {
          alternate {
            path success {
              B -> C
              alternate {
                path s1 { C -> D }
                path s2 { C -> A }
              }
            }
            path failure {
              B -> A
            }
          }
        }
      }
    `)
      expect(errors).toHaveLength(0)
    })

    it('should report duplicate path names', async ({ expect }) => {
      const { validate } = createTestServices()
      const { errors } = await validate(`
      specification {
        element component
      }
      model {
        component A
        component B
        component C
      }
      views {
        dynamic view index {
          parallel {
            path duplicate {
              A -> B
            }
            path duplicate {
              B -> C
            }
          }
        }
      }
    `)
      expect(errors.filter(e => e.includes('Duplicate path name "duplicate"'))).toHaveLength(2)
    })

    it('should allow mixed named paths and anonymous steps', async ({ expect }) => {
      const { validate } = createTestServices()
      const { errors } = await validate(`
      specification {
        element component
      }
      model {
        component A
        component B
        component C
      }
      views {
        dynamic view index {
          parallel {
            A -> B
            path named {
              B -> C
            }
            C -> A
          }
        }
      }
    `)
      expect(errors).toHaveLength(0)
    })
  })
})
