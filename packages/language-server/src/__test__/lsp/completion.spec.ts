import { expectCompletion as langiumExpectCompletion } from 'langium/test'
import { pluck } from 'rambdax'
import { vi, describe, it, expect } from 'vitest'
import { createTestServices } from '../../test'

vi.mock('../../logger')

function expectCompletion() {
  const services = createTestServices().services
  return langiumExpectCompletion(services)
}

describe('Completions', () => {
  it('should suggest keywords inside specification', async () => {
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

  it('should suggest keywords inside model', async () => {
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
        expect(pluck('label', completions.items)).to.include.members(['actor', 'system', 'extend'])
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
          'style',
          'sys',
          'this'
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

  it('should suggest keywords inside element', async () => {
    const text = `
      specification {
        element actor
        element system
        tag deprecated
      }
      model {
        actor customer {
          <|>
        }
        <|>
      }
    `
    const completion = expectCompletion()

    await completion({
      text,
      index: 0,
      assert: completions => {
        expect(completions.items).not.to.be.empty
        const labels = pluck('label', completions.items)
        expect(labels).to.include.members([
          '#deprecated',
          'title',
          'technology',
          'description',
          'link',
          'style',
          'this',
          'actor',
          'system'
        ])
        expect(labels).not.to.include.members(['extend'])
      }
    })
    await completion({
      text,
      index: 1,
      assert: completions => {
        expect(completions.items).not.to.be.empty
        expect(pluck('label', completions.items)).to.include.members([
          'customer',
          'extend',
          'actor',
          'system'
        ])
      }
    })
  })

  it('should suggest nested elements for elementref', async () => {
    const text = `
      specification {
        element component
      }
      model {
        root = component {
          c1 = component {
            c2 = component {
              notunique = component
            }
            notunique = component
          }
        }
        cloud = component {
          -> <|>root.<|>c1.<|>
        }
        cloud2 = component {
          -> c2.<|>
        }
      }
    `
    const completion = expectCompletion()

    await completion({
      text,
      index: 0,
      expectedItems: ['root', 'cloud', 'cloud2', 'c1', 'c2', 'notunique'],
      disposeAfterCheck: true
    })
    await completion({
      text,
      index: 1,
      expectedItems: ['c1', 'c2'],
      disposeAfterCheck: true
    })
    await completion({
      text,
      index: 2,
      expectedItems: ['c2', 'notunique'],
      disposeAfterCheck: true
    })
    await completion({
      text,
      index: 3,
      expectedItems: ['notunique']
    })
  })
})
