import { describe, it } from 'vitest'
import { createTestServices } from '../test/testServices'
import { test } from './asserts'

describe('Deployment model:', () => {
  test('deployment node with properties').valid`
     specification {
      deploymentNode environment
      deploymentNode node
    }
    deployment {
      environment dev 'Development' {
        node n1 {
          title 'Node 1'
        }
        n2 = node {
          title 'Node 2'
        }
      }
      prod = environment 'Production' {
        description 'Production environment'
      }
    }`

  test('allow nested nodes').valid`
    specification {
      deploymentNode environment
      deploymentNode node
    }
    deployment {
      environment dev {
        node n1 {
          node n2
          node n3 {
            n4 = node
            node n5 {
              n6 = node
            }
          }
        }

        n2 = node {
          n3 = node {
            n4 = node {
              n5 = node
            }
          }
        }
      }
    }
  `
  describe('deployment ref', () => {
    test('resolve deployment ref').valid`
      specification {
        element component
        deploymentNode node
      }
      model {
        component sys1 {
          component cmp1 {
            component cmp2 {
              component cmp3
            }
          }
        }
        component sys2 {
          component cmp1 {
            component cmp2 {
              component cmp3
            }
          }
        }
      }
      deployment {
        node n1 {
          node n2 {
            instanceOf sys1
            instanceOf sys2
          }
          node n3 {
            sys = instanceOf sys2
          }
        }

        n1.n2.sys1.cmp2 -> n1.n2.sys2.cmp3
        n1.n2.sys1 -> n1.n3.sys.cmp2
      }
      deployment {
        sys1 -> sys.cmp2
      }
    `

    it.concurrent('resolve global deployment ref', async ({ expect }) => {
      const { parse, validateAll } = createTestServices()
      await parse(`
        specification {
          element component
          deploymentNode node
        }
        model {
          component sys1 {
            component cmp1
          }
          component sys2 {
            component cmp2
          }
        }
        deployment {
          node n1 {
            instanceOf sys1
            instanceOf sys2
          }
          node n2 {
            sys = instanceOf sys2
          }
        }
        deployment {
          // this is ok in same document
          sys1 -> sys2
        }
      `)
      await parse(`
        deployment {
          n1.sys1 -> n2.sys
        }
      `)
      const validation1 = await validateAll()
      expect(validation1.errors).toEqual([])

      // Should resolve only from global deployment
      await parse(`
        deployment {
          sys1 -> n2.sys
        }
      `)

      const validation2 = await validateAll()
      expect(validation2.errors).toEqual([
        `Could not resolve reference to DeploymentReferenceable named 'sys1'.`
      ])
    })
  })
})
