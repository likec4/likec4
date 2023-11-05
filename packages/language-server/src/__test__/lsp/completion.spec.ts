import { expectCompletion as langiumExpectCompletion } from 'langium/test'
import { pluck } from 'rambdax'
import { describe, it } from 'vitest'
import { createTestServices } from '../../test'

function expectCompletion() {
  const services = createTestServices().services
  return langiumExpectCompletion(services)
}

describe('Completions', () => {
  it('should correct keywords inside specification', async () => {
    const text = `
      <|>spe<|>cification {
        <|>el<|>ement frontend {
          <|>style {
            <|>shape <|>browser
            color <|>secondary
          }
        }
      }
    `
    const completion = expectCompletion()

    await completion({
      text,
      index: 0,
      expectedItems: ['specification', 'model', 'views']
    })

    await completion({
      text,
      index: 1,
      expectedItems: ['specification']
    })

    await completion({
      text,
      index: 2,
      expectedItems: ['element', 'tag', 'relationship']
    })
    await completion({
      text,
      index: 3,
      expectedItems: ['element']
    })
    await completion({
      text,
      index: 4,
      expectedItems: ['style']
    })
    await completion({
      text,
      index: 5,
      expectedItems: ['color', 'shape', 'icon']
    })
    await completion({
      text,
      index: 6,
      expectedItems: ['rectangle', 'person', 'browser', 'mobile', 'cylinder', 'storage', 'queue']
    })
    await completion({
      text,
      index: 7,
      expectedItems: [
        'primary',
        'secondary',
        'muted',
        'slate',
        'blue',
        'indigo',
        'sky',
        'red',
        'gray',
        'green',
        'amber'
      ]
    })
  })

  it('should correct keywords inside model', async ({ expect }) => {
    const text = `
      specification {
        element actor
        element system
      }
      model {
        <|>act<|>or customer {
          <|>t<|>itle 'customer'
        }
        sys = <|>s<|>ystem {
          -> <|>customer
        }
      }
    `
    const completion = expectCompletion()

    await completion({
      text,
      index: 0,
      assert: completions => {
        expect(completions.items).not.to.be.empty
        expect(completions.items[0]!.label).toEqual('actor')
        expect(completions.items[1]!.label).toEqual('system')
      }
    })
    await completion({
      text,
      index: 1,
      expectedItems: ['actor']
    })
    await completion({
      text,
      index: 2,
      assert: completions => {
        expect(completions.items).not.to.be.empty
        expect(pluck('label', completions.items)).to.include.members([
          'title',
          'technology',
          'description',
          'link',
          'style'
        ])
      }
    })
    await completion({
      text,
      index: 3,
      expectedItems: ['title', 'technology', 'this']
    })
    // sys = <|>s<|>ystem {
    await completion({
      text,
      index: 4,
      expectedItems: ['actor', 'system']
    })
    await completion({
      text,
      index: 5,
      expectedItems: ['system']
    })
    // -> <|>customer
    await completion({
      text,
      index: 6,
      expectedItems: ['customer', 'sys']
    })
  })
})
