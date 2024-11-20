import { describe } from 'vitest'
import { test } from './asserts'

describe.concurrent('deployments', () => {
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
    `
})
