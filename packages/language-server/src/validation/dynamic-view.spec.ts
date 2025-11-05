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
    it('should report error for empty parallel block', async ({ expect }) => {
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
          dynamic view test {
            parallel {
            }
          }
        }
      `)
      expect(errors).toContain('Parallel block has no paths or steps')
    })

    it('should report error for empty alternate block', async ({ expect }) => {
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
          dynamic view test {
            alternate {
            }
          }
        }
      `)
      expect(errors).toContain('Alternate block has no paths or steps')
    })

    it('should warn for parallel block with single path', async ({ expect }) => {
      const { validate } = createTestServices()
      const { errors, warnings } = await validate(`
        specification {
          element component
        }
        model {
          component A
          component B
        }
        views {
          dynamic view test {
            parallel {
              A -> B
            }
          }
        }
      `)
      expect(errors).toHaveLength(0)
      expect(warnings).toContain(
        'Parallel block with only one path has no branching value. Consider removing the parallel wrapper.',
      )
    })

    it('should warn for alternate block with single path', async ({ expect }) => {
      const { validate } = createTestServices()
      const { errors, warnings } = await validate(`
        specification {
          element component
        }
        model {
          component A
          component B
        }
        views {
          dynamic view test {
            alternate {
              path single {
                A -> B
              }
            }
          }
        }
      `)
      expect(errors).toHaveLength(0)
      expect(warnings).toContain(
        'Alternate block with only one path has no branching value. Consider removing the alternate wrapper.',
      )
    })

    it('should not warn for parallel block with multiple paths', async ({ expect }) => {
      const { validate } = createTestServices()
      const { errors, warnings } = await validate(`
        specification {
          element component
        }
        model {
          component A
          component B
          component C
        }
        views {
          dynamic view test {
            parallel {
              A -> B
              B -> C
            }
          }
        }
      `)
      expect(errors).toHaveLength(0)
      expect(warnings).toHaveLength(0)
    })

    it('should error on nested parallel in parallel with no other steps', async ({ expect }) => {
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
          dynamic view test {
            parallel {
              path outer {
                parallel {
                  A -> B
                  B -> C
                }
              }
            }
          }
        }
      `)
      expect(errors).toContain(
        'Nested parallel inside parallel with no other steps is not allowed. Parallel blocks are associative - flatten inner parallel paths into the parent parallel.',
      )
    })

    it('should warn on anonymous nested parallel in parallel', async ({ expect }) => {
      const { validate } = createTestServices()
      const { errors, warnings } = await validate(`
        specification {
          element component
        }
        model {
          component A
          component B
          component C
        }
        views {
          dynamic view test {
            parallel {
              A -> B
              parallel {
                B -> C
              }
            }
          }
        }
      `)
      expect(errors).toHaveLength(0)
      expect(warnings).toContain(
        'Anonymous nested parallel will create a separate path. Consider using named paths for clarity.',
      )
    })

    it('should hint on nested alternate in alternate', async ({ expect }) => {
      const { validate } = createTestServices()
      const { errors, hints } = await validate(`
        specification {
          element component
        }
        model {
          component A
          component B
          component C
        }
        views {
          dynamic view test {
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
      expect(errors).toHaveLength(0)
      expect(hints).toContain(
        'Nested alternate inside alternate with no other steps can be flattened. Alternate blocks are associative - consider using sibling paths instead.',
      )
    })

    it('should allow nested alternate in parallel', async ({ expect }) => {
      const { validate } = createTestServices()
      const { errors, warnings } = await validate(`
        specification {
          element component
        }
        model {
          component A
          component B
          component C
        }
        views {
          dynamic view test {
            parallel {
              path success {
                A -> B
              }
              path decision {
                alternate {
                  path optionA { B -> C }
                  path optionB { B -> A }
                }
              }
            }
          }
        }
      `)
      expect(errors).toHaveLength(0)
      expect(warnings).toHaveLength(0)
    })

    it('should allow nested parallel in alternate', async ({ expect }) => {
      const { validate } = createTestServices()
      const { errors, warnings } = await validate(`
        specification {
          element component
        }
        model {
          component A
          component B
          component C
        }
        views {
          dynamic view test {
            alternate {
              path route1 {
                parallel {
                  A -> B
                  B -> C
                }
              }
              path route2 {
                A -> C
              }
            }
          }
        }
      `)
      expect(errors).toHaveLength(0)
      expect(warnings).toHaveLength(0)
    })

    it('should error on duplicate path names in parallel', async ({ expect }) => {
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
          dynamic view test {
            parallel {
              path success { A -> B }
              path success { B -> C }
            }
          }
        }
      `)
      expect(errors.filter(e => e.includes('Duplicate path name "success"'))).toHaveLength(2)
    })

    it('should error on duplicate path names in alternate', async ({ expect }) => {
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
          dynamic view test {
            alternate {
              path optionA { A -> B }
              path optionA { B -> C }
            }
          }
        }
      `)
      expect(errors.filter(e => e.includes('Duplicate path name "optionA"'))).toHaveLength(2)
    })

    it('should allow anonymous paths without names', async ({ expect }) => {
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
          dynamic view test {
            parallel {
              A -> B
              B -> C
            }
          }
        }
      `)
      expect(errors).toHaveLength(0)
    })

    it('should allow mixed named and anonymous paths', async ({ expect }) => {
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
          dynamic view test {
            parallel {
              path success { A -> B }
              B -> C
            }
          }
        }
      `)
      expect(errors).toHaveLength(0)
    })

    it('should handle multiple duplicate path names', async ({ expect }) => {
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
          dynamic view test {
            parallel {
              path dup { A -> B }
              path dup { B -> C }
              path dup { C -> D }
            }
          }
        }
      `)
      expect(errors.filter(e => e.includes('Duplicate path name "dup"'))).toHaveLength(3)
    })

    it('should validate parallel short form "par"', async ({ expect }) => {
      const { validate } = createTestServices()
      const { errors, warnings } = await validate(`
        specification {
          element component
        }
        model {
          component A
          component B
        }
        views {
          dynamic view test {
            par {
              A -> B
            }
          }
        }
      `)
      expect(errors).toHaveLength(0)
      expect(warnings).toContain(
        'Parallel block with only one path has no branching value. Consider removing the parallel wrapper.',
      )
    })

    it('should validate alternate short form "alt"', async ({ expect }) => {
      const { validate } = createTestServices()
      const { errors, warnings } = await validate(`
        specification {
          element component
        }
        model {
          component A
          component B
        }
        views {
          dynamic view test {
            alt {
              path single { A -> B }
            }
          }
        }
      `)
      expect(errors).toHaveLength(0)
      expect(warnings).toContain(
        'Alternate block with only one path has no branching value. Consider removing the alternate wrapper.',
      )
    })
  })
})
