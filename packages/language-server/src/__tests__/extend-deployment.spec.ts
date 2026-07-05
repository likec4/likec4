import { describe } from 'vitest'
import { testFileScope as it } from '../test'

describe('extend-deployment scope', () => {
  const document1 = `
    specification {
      element component
      deploymentNode node
    }
    model {
      component system {
        component cmp1
      }
    }
    deployment {
      node n1

      n1.n3 -> n1.n2.cmp1
    }`

  const document2 = `
    deployment {
      // extend node from document3
      extend n1.n2 {
        instanceOf system.cmp1
      }
    }`

  const document3 = `
    deployment {
      extend n1 {
        node n2
        node n3
      }
    }`

  it('should parse correctly', async ({ expect, t }) => {
    await t.addDocument(document1, 'model.c4')
    await t.addDocument(document2, 'deploy.c4')
    await t.addDocument(document3, 'deploy2.c4')

    const { errors } = await t.validateAll()

    expect(errors).toEqual([])
  })
})
