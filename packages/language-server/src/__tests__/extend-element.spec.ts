import { describe, it } from 'vitest'
import { createTestServices } from '../test'

describe('extend-element scope', () => {
  const document1 = `
specification {
  element component
  tag tag1
  tag tag2
}
model {
  component system {
    sub = component {
      component sub1
    }
  }
  component system2
}`
  const document2 = `
model {
  system.sub1 -> system.sub2

  extend system.sub.sub2 {
    #tag2
    sub2 -> system2
  }
}`

  const document3 = `
model {
  extend system.sub {
    #tag1
    component sub2 {
      -> sub1
    }
  }
}`

  it('parser smoke: ExtendsElement Scope', async ({ expect }) => {
    const { addDocument, validateAll } = createTestServices()
    await addDocument(document1)
    await addDocument(document2)
    await addDocument(document3)

    const { errors } = await validateAll()

    expect(errors).toEqual([])
  })
})
