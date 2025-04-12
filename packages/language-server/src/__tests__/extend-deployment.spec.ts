import { describe, it } from 'vitest'
import { createTestServices } from '../test'

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

  it('should parse correctly', async ({ expect }) => {
    const { addDocument, validateAll } = createTestServices()
    await addDocument(document1)
    await addDocument(document2)
    await addDocument(document3)

    const { errors } = await validateAll()

    expect(errors).toEqual([])
  })
})
