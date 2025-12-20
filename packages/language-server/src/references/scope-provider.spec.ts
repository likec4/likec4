import { describe, expect, it } from 'vitest'
import { createTestServices } from '../test'

describe.concurrent('LikeC4ScopeProvider', () => {
  describe('genUniqueDescedants', () => {
    it('should resolve descendants in extend element', async ({ expect }) => {
      const { validate } = createTestServices()
      
      const { document, errors } = await validate(`
        specification {
          element component
        }
        model {
          component parent {
            component child1
            component child2 {
              component grandchild
            }
          }
          
          extend parent {
            component child3
            child1 -> child2
          }
        }
      `)

      expect(errors).toHaveLength(0)
      // The fact that child1 and child2 are resolved correctly
      // means genUniqueDescedants is working
    })

    it('should resolve descendants in element views', async ({ expect }) => {
      const { validate } = createTestServices()
      
      const { document, errors } = await validate(`
        specification {
          element component
        }
        model {
          component sys1 {
            component inner1
            component inner2
          }
          component sys2
        }
        views {
          view sys1View of sys1 {
            include inner1, inner2
          }
        }
      `)

      expect(errors).toHaveLength(0)
      // inner1 and inner2 should be resolvable within the view
    })

    it('should handle undefined element gracefully', async ({ expect }) => {
      const { validate } = createTestServices()
      
      const { document, errors } = await validate(`
        specification {
          element component
        }
        model {
          component sys1
          
          extend sys2 {
            component inner
          }
        }
      `)

      expect(errors.length).toBeGreaterThan(0)
      expect(errors.some(e => e.includes('sys2'))).toBe(true)
    })

    it('should resolve deployment node descendants', async ({ expect }) => {
      const { validate } = createTestServices()
      
      const { document, errors } = await validate(`
        specification {
          element component
          deployment node server
        }
        model {
          component app
          
          deployment {
            node server1 {
              instanceOf app as appInstance
            }
            
            extend server1 {
              node nested
            }
          }
        }
      `)

      expect(errors).toHaveLength(0)
    })

    it('should resolve descendants through imported elements', async ({ expect }) => {
      const { services, addDocument } = createTestServices()
      
      // First document with exported element
      await addDocument(`
        specification {
          element component
        }
        model {
          component @exported {
            component inner
          }
        }
      `, 'source.c4')

      // Second document importing and extending
      const { errors } = await services.validate(`
        specification {
          element component
        }
        model {
          import * from './source.c4'
          
          extend exported {
            component added
          }
        }
      `, 'target.c4')

      // Should resolve without errors
      expect(errors).toHaveLength(0)
    })

    it('should handle deeply nested element hierarchies', async ({ expect }) => {
      const { validate } = createTestServices()
      
      const { document, errors } = await validate(`
        specification {
          element component
        }
        model {
          component level1 {
            component level2 {
              component level3 {
                component level4 {
                  component level5
                }
              }
            }
          }
          
          extend level1 {
            level2.level3.level4 -> level5
          }
        }
      `)

      expect(errors).toHaveLength(0)
    })
  })

  describe('element view scoping', () => {
    it('should make viewOf element resolvable in view body', async ({ expect }) => {
      const { validate } = createTestServices()
      
      const { document, errors } = await validate(`
        specification {
          element component
        }
        model {
          component parent {
            component child1
            component child2
          }
        }
        views {
          view parentView of parent {
            include child1, child2
            child1 -> child2
          }
        }
      `)

      expect(errors).toHaveLength(0)
    })

    it('should handle view extension correctly', async ({ expect }) => {
      const { validate } = createTestServices()
      
      const { document, errors } = await validate(`
        specification {
          element component
        }
        model {
          component sys {
            component inner
          }
        }
        views {
          view base of sys {
            include inner
          }
          
          view extended extends base {
            style inner {
              color: red
            }
          }
        }
      `)

      expect(errors).toHaveLength(0)
    })
  })

  describe('deployment scoping', () => {
    it('should resolve deployment node children', async ({ expect }) => {
      const { validate } = createTestServices()
      
      const { document, errors } = await validate(`
        specification {
          element component
          deployment node server
          deployment node region
        }
        model {
          component app
          
          deployment {
            node region1 {
              node server1 {
                instanceOf app as instance1
              }
              node server2
            }
            
            extend region1 {
              server1 -> server2
            }
          }
        }
      `)

      expect(errors).toHaveLength(0)
    })

    it('should resolve deployed instances', async ({ expect }) => {
      const { validate } = createTestServices()
      
      const { document, errors } = await validate(`
        specification {
          element component
          deployment node server
        }
        model {
          component backend {
            component api
            component db
          }
          
          deployment {
            node server1 {
              instanceOf backend as backendInstance
              backendInstance.api -> backendInstance.db
            }
          }
        }
      `)

      expect(errors).toHaveLength(0)
    })
  })
})