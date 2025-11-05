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
})

  describe('dynamicViewBranchCollection validation', () => {
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
          dynamic view index {
            parallel {
            }
          }
        }
      `)
      expect(errors).to.include.members(['Parallel block has no paths or steps'])
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
          dynamic view index {
            alternate {
            }
          }
        }
      `)
      expect(errors).to.include.members(['Alternate block has no paths or steps'])
    })

    it('should report warning for degenerate single-path parallel', async ({ expect }) => {
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
              path single {
                A -> B
              }
            }
          }
        }
      `)
      expect(warnings).to.satisfy((w: string[]) => 
        w.some(msg => msg.includes('only one path') && msg.includes('no branching value'))
      )
    })

    it('should report warning for degenerate single-path alternate', async ({ expect }) => {
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
              path single {
                A -> B
              }
            }
          }
        }
      `)
      expect(warnings).to.satisfy((w: string[]) => 
        w.some(msg => msg.includes('only one path') && msg.includes('no branching value'))
      )
    })

    it('should report error for nested parallel-in-parallel', async ({ expect }) => {
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
                  path inner1 {
                    A -> B
                  }
                  path inner2 {
                    B -> C
                  }
                }
              }
            }
          }
        }
      `)
      expect(errors).to.satisfy((e: string[]) => 
        e.some(msg => msg.includes('Nested parallel inside parallel'))
      )
    })

    it('should report hint for nested alternate-in-alternate', async ({ expect }) => {
      const { validate } = createTestServices()
      const { diagnostics } = await validate(`
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
                  path inner1 {
                    A -> B
                  }
                  path inner2 {
                    B -> C
                  }
                }
              }
            }
          }
        }
      `)
      const hints = diagnostics.filter(d => d.severity === 4) // Hint severity
      expect(hints.length).toBeGreaterThan(0)
    })

    it('should report error for duplicate path names in parallel', async ({ expect }) => {
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
      expect(errors.filter(e => e.includes('Duplicate path name'))).toHaveLength(2)
    })

    it('should report error for duplicate path names in alternate', async ({ expect }) => {
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
            alternate {
              path dup {
                A -> B
              }
              path dup {
                B -> C
              }
            }
          }
        }
      `)
      expect(errors.filter(e => e.includes('Duplicate path name'))).toHaveLength(2)
    })

    it('should allow valid parallel with multiple paths', async ({ expect }) => {
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
              path path1 {
                A -> B
              }
              path path2 {
                B -> C
              }
            }
          }
        }
      `)
      expect(errors).toEqual([])
    })

    it('should allow valid alternate with multiple paths', async ({ expect }) => {
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
            alternate {
              path success {
                A -> B
              }
              path failure {
                A -> C
              }
            }
          }
        }
      `)
      expect(errors).toEqual([])
    })

    it('should allow nested alternate-in-parallel', async ({ expect }) => {
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
            parallel {
              path p1 {
                A -> B
              }
              path p2 {
                alternate {
                  path a1 {
                    C -> D
                  }
                  path a2 {
                    D -> C
                  }
                }
              }
            }
          }
        }
      `)
      expect(errors).toEqual([])
    })

    it('should allow nested parallel-in-alternate', async ({ expect }) => {
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
              path a1 {
                A -> B
              }
              path a2 {
                parallel {
                  path p1 {
                    C -> D
                  }
                  path p2 {
                    D -> C
                  }
                }
              }
            }
          }
        }
      `)
      expect(errors).toEqual([])
    })

    it('should allow anonymous parallel steps', async ({ expect }) => {
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
              B -> C
            }
          }
        }
      `)
      expect(errors).toEqual([])
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
          component D
        }
        views {
          dynamic view index {
            parallel {
              path named {
                A -> B
              }
              C -> D
            }
          }
        }
      `)
      expect(errors).toEqual([])
    })
  })