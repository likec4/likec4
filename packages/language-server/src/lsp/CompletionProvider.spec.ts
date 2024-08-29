import { expectCompletion as langiumExpectCompletion } from 'langium/test'
import { map, prop, take } from 'remeda'
import { describe, expect, it, vi } from 'vitest'
import { createTestServices } from '../test'

function pluck<K extends keyof T, T>(property: K, list: T[]): T[K][] {
  return map(list, prop(property))
}

function expectCompletion() {
  const services = createTestServices().services
  return langiumExpectCompletion(services)
}

describe('LikeC4CompletionProvider', () => {
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
      expectedItems: [
        'specification',
        'model',
        'views',
        'likec4lib'
      ]
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
      expectedItems: ['technology', 'notation', 'style']
    })
    await completion({
      text,
      index: 5,
      expectedItems: ['color', 'shape', 'border', 'opacity', 'icon']
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
          'sys'
        ])
      }
    })
    await completion({
      text,
      index: 3,
      expectedItems: ['title', 'technology']
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
        tag tag1
        tag tag2
        tag tag3
      }
      model {
        actor customer {
          <|>#tag1 #tag2 <|>
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
          '#tag1',
          '#tag2',
          '#tag3',
          'title',
          'technology',
          'description',
          'link',
          'style',
          'actor',
          'system',
          'metadata'
        ])
        expect(labels).not.to.include.members(['extend'])
      }
    })
    await completion({
      text,
      index: 1,
      assert: completions => {
        expect(completions.items).not.to.be.empty
        const labels = pluck('label', completions.items)
        expect(labels).to.include.members([
          '#tag1',
          '#tag2',
          '#tag3'
        ])
        expect(labels).not.to.include.members(['extend'])
      }
    })
    await completion({
      text,
      index: 2,
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

  it.todo('should suggest relationship kind after dot', async () => {
    const text = `
      specification {
        element actor
        relationship uses
      }
      model {
        actor customer {
          .<|>
        }
      }
    `
    const completion = expectCompletion()

    await completion({
      text,
      index: 0,
      expectedItems: [
        '.uses'
      ]
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
  it('should suggest nested elements inside view predicates', async () => {
    const text = `
      specification {
        element component
      }
      model {
        root = component {
          a = component {
            b1 = component {
              b2 = component
            }
          }
        }
      }
      views {
        view {
          include
            <|>root.<|> -> *,
            * -> b<|>2 <|>
        }
      }
    `
    const completion = expectCompletion()

    await completion({
      text,
      index: 0,
      expectedItems: [
        'root',
        'a',
        'b1',
        'b2',
        'element.tag',
        'element.kind'
      ],
      disposeAfterCheck: true
    })
    await completion({
      text,
      index: 1,
      expectedItems: ['a', 'b1', 'b2'],
      disposeAfterCheck: true
    })
    await completion({
      text,
      index: 2,
      expectedItems: ['b1', 'b2'],
      disposeAfterCheck: true
    })
    await completion({
      text,
      index: 3,
      expectedItems: [
        'where',
        'with',
        'include',
        'exclude',
        'style',
        'autoLayout'
      ],
      disposeAfterCheck: true
    })
  })
  it('should suggest tags inside "where"-predicates', async () => {
    const text = `
      specification {
        element service
        element component
        tag tag1
        tag tag2
        relationship uses
      }
      model {
        root = component {
          a = component {
            b1 = component {
              b2 = component
            }
          }
        }
      }
      views {
        view {
          include
            * where (
              tag == <|>#tag1 and
              tag is not #<|>tag2 or
              kind != <|>service
            )
        }
      }
    `
    const completion = expectCompletion()

    await completion({
      text,
      index: 0,
      assert: completions => {
        expect(completions.items).not.to.be.empty
        const first = take(completions.items, 2)
        expect(pluck('label', first)).toEqual([
          '#tag1',
          '#tag2'
        ])
      },
      disposeAfterCheck: true
    })
    await completion({
      text,
      index: 1,
      expectedItems: [
        '#tag1',
        '#tag2'
      ],
      disposeAfterCheck: true
    })
    await completion({
      text,
      index: 2,
      assert: completions => {
        expect(completions.items).not.to.be.empty
        const first = take(completions.items, 2)
        expect(pluck('label', first)).toEqual([
          'service',
          'component'
        ])
      },
      disposeAfterCheck: true
    })
  })

  it('should suggest views for navigateTo', async () => {
    const text = `
      specification {
        element component
      }
      model {
        root = component
      }
      views {
        view index {
          include *
        }
        view view2 {
          include *
        }
        dynamic view view3 { // should also suggest dynamic views
        }
        view {
          include root <|>with {
            <|>navigateTo <|>
          }
        }
      }
    `
    const completion = expectCompletion()

    await completion({
      text,
      index: 0,
      expectedItems: [
        'where',
        'with',
        'include',
        'exclude',
        'style',
        'autoLayout'
      ],
      disposeAfterCheck: true
    })
    await completion({
      text,
      index: 1,
      expectedItems: [
        'navigateTo',
        'title',
        'technology',
        'description',
        'notation',
        'color',
        'shape',
        'border',
        'opacity',
        'icon'
      ],
      disposeAfterCheck: true
    })
    await completion({
      text,
      index: 2,
      expectedItems: ['index', 'view2', 'view3'],
      disposeAfterCheck: true
    })
  })

  it('should suggest tags', async ({ expect }) => {
    const text = `
      specification {
        element component
        tag deprecated
        tag experimental
      }
      model {
        c1 = component
        c2 = component {
          <|>#<|>deprecated
          -> c1 <|>
        }
      }

    `
    const completion = expectCompletion()

    await completion({
      text,
      index: 0,
      assert: completions => {
        expect(completions.items).not.to.be.empty
        const first = take(completions.items, 2)
        expect(pluck('label', first)).toEqual([
          '#deprecated',
          '#experimental'
        ])
      },
      disposeAfterCheck: true
    })

    // #<|>deprecated
    await completion({
      text,
      index: 1,
      expectedItems: ['#deprecated', '#experimental']
    })
    // > c1 <|>
    await completion({
      text,
      index: 2,
      assert: completions => {
        expect(completions.items).not.to.be.empty
        const first = take(completions.items, 2)
        expect(pluck('label', first)).toEqual([
          '#deprecated',
          '#experimental'
        ])
      },
      disposeAfterCheck: true
    })
  })
})
