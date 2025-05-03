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

  it('parser smoke: extends with activity', async ({ expect }) => {
    const { addDocument, validateAll, buildModel } = createTestServices()
    await addDocument(document1)
    await addDocument(`
      model {
        component system3
        extend system.sub.sub1 {
          activity A {
            -> system3
          }
        }
      }
    `)
    await addDocument(`
      model {
        extend system.sub {
          component sub2
        }
        extend system2 {
          activity B {
            <- sub2
          }
        }
      }
    `)

    const { errors } = await validateAll()
    expect(errors).toEqual([])

    const model = await buildModel()
    expect(model.activities).toMatchObject({
      'system.sub.sub1#A': {
        id: 'system.sub.sub1#A',
        modelRef: 'system.sub.sub1',
        name: 'A',
        steps: [{
          id: expect.any(String),
          target: {
            model: 'system3',
          },
          title: '',
        }],
      },
      'system2#B': {
        id: 'system2#B',
        modelRef: 'system2',
        name: 'B',
        steps: [{
          id: expect.any(String),
          isBackward: true,
          target: {
            model: 'system.sub.sub2',
          },
          title: '',
        }],
      },
    })
  })
})
