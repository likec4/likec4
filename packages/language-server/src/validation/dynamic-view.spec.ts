import { describe, test } from 'vitest'
import { createTestServices } from '../test'

const it = test.extend<{
  $file: {
    t: ReturnType<typeof createTestServices>
  }
}>({
  t: [async ({}, use) => {
    const t = createTestServices()
    await use(t)
    t[Symbol.dispose]()
  }, { scope: 'file' }],
})
  .extend('validate', async ({ t }, { onCleanup }) => {
    onCleanup(() => t.resetState())
    return t.validate
  })

describe('DynamicView Checks', () => {
  describe('stepChecks', () => {
    it('should not report invalid relations', async ({ expect, validate }) => {
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

    it('should report invalid step target', async ({ expect, validate }) => {
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

    it('should report invalid step source', async ({ expect, validate }) => {
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

    it('should report invalid step: -> nested child', async ({ expect, validate }) => {
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

    it('should report invalid step: child -> parent', async ({ expect, validate }) => {
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

    it('should report invalid step: A <- B -> C', async ({ expect, validate }) => {
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

    it('should not report self-reference (loop)', async ({ expect, validate }) => {
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

  describe('parallel blocks', () => {
    it('accepts a single, non-nested parallel block', async ({ expect, validate }) => {
      const { errors } = await validate(`
        specification {
          element component
        }
        model {
          component a
          component b
          component c
        }
        views {
          dynamic view index {
            a -> b
            parallel {
              a -> c
              b -> c
            }
          }
        }
      `)
      expect(errors).toEqual([])
    })

    it('reports a clear diagnostic when a parallel block is nested inside another', async ({ expect, validate }) => {
      const { errors } = await validate(`
        specification {
          element component
        }
        model {
          component a
          component b
          component c
        }
        views {
          dynamic view index {
            parallel {
              a -> b
              parallel {
                a -> c
                b -> c
              }
            }
          }
        }
      `)
      expect(errors).toContain('Nested parallel blocks are not allowed')
    })

    it('also reports nesting when using the `par` alias', async ({ expect, validate }) => {
      const { errors } = await validate(`
        specification {
          element component
        }
        model {
          component a
          component b
        }
        views {
          dynamic view index {
            par {
              par {
                a -> b
              }
            }
          }
        }
      `)
      expect(errors).toContain('Nested parallel blocks are not allowed')
    })
  })

  describe('alt blocks', () => {
    it('should validate alt blocks', async ({ expect, validate }) => {
      const { formattedError } = await validate(`
      specification {
        element component
      }
      model {
        component a
        component b
      }
      views {
        dynamic view index {
          alt {
            if {
              a -> b
            }
            when {
              a -> b
            }
            else {
              a -> b
            }
          }
        }
      }
    `)
      expect(formattedError).to.be.empty
    })

    it('should report if direct child of alt block is not a branch', async ({ expect, validate }) => {
      let { formattedError } = await validate(`
        specification {
          element component
        }
        model {
          component a
        }
        views {
          dynamic view index {
            alt {
              loop {
                a -> a
              }
              opt {
                a -> a
              }
              parallel {
                a -> a
              }
            }
          }
        }
      `)
      expect(formattedError).to.include('"loop" can not be used as an alternative branch')
      expect(formattedError).to.include('"opt" can not be used as an alternative branch')
      expect(formattedError).to.include('"parallel" can not be used as an alternative branch')
    })

    it('should report if branch is not inside alt block', async ({ expect, validate }) => {
      let { formattedError } = await validate(`
        specification {
          element component
        }
        model {
          component a
        }
        views {
          dynamic view index {
            a -> a
            when 'aaa' {
              a -> a
            }
            loop {
              if 'condition' {
                a -> a
              }
            }
            parallel {
              a -> a
              else {
                a -> a
              }
            }
          }
        }
      `)
      expect(formattedError).to.include('"when" alternative branch must be inside "alt"')
      expect(formattedError).to.include('"if" alternative branch must be inside "alt"')
      expect(formattedError).to.include('"else" alternative branch must be inside "alt"')
    })
  })

  describe('display variant', () => {
    it('should report if invalid mode', async ({ expect, validate }) => {
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

    it('should not report for valid modes', async ({ expect, validate }) => {
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
