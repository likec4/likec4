import { expectCompletion as langiumExpectCompletion } from 'langium/test'
import { map, prop, take } from 'remeda'
import { type ExpectStatic, describe, it } from 'vitest'
import { createMultiProjectTestServices, createTestServices } from '../test'

function pluck<K extends keyof T, T>(property: K, list: T[]): T[K][] {
  return map(list, prop(property))
}

function expectCompletion() {
  const services = createTestServices().services
  return langiumExpectCompletion(services)
}

describe.concurrent('LikeC4CompletionProvider', () => {
  it('should suggest keywords inside specification', async ({ expect }) => {
    const text = `
      <|>spe<|>cification {
        <|>el<|>ement frontend {
          <|>style {
            <|>shape <|>browser
            color <|>secondary
          }
        }
        color custom-color #ff0000
      }
    `
    const completion = expectCompletion()

    await completion({
      text,
      index: 0,
      expectedItems: [
        'import',
        'specification',
        'model',
        'views',
        'global',
        'deployment',
        'likec4lib',
      ],
    })

    await completion({
      text,
      index: 1,
      expectedItems: ['specification'],
    })

    await completion({
      text,
      index: 2,
      expectedItems: ['element', 'tag', 'relationship', 'color', 'deploymentNode'],
    })
    await completion({
      text,
      index: 3,
      expectedItems: ['element'],
    })
    await completion({
      text,
      index: 4,
      expectedItems: ['title', 'description', 'technology', 'notation', 'summary', 'link', 'style'],
    })
    await completion({
      text,
      index: 5,
      expectedItems: ['color', 'shape', 'border', 'opacity', 'icon', 'multiple', 'size', 'padding', 'textSize'],
    })
    await completion({
      text,
      index: 6,
      expectedItems: [
        'rectangle',
        'person',
        'browser',
        'mobile',
        'cylinder',
        'storage',
        'queue',
        'bucket',
        'document',
      ],
    })
    await completion({
      text,
      index: 7,
      expectedItems: [
        'custom-color',
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
        'amber',
      ],
    })
  })

  it('should suggest keywords inside model', async ({ expect }) => {
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
      },
    })
    await completion({
      text,
      index: 1,
      expectedItems: ['actor'],
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
        ])
      },
    })
    await completion({
      text,
      index: 3,
      expectedItems: [
        'title',
        'technology',
        'this',
        // target is reserved keyword and suggested as id new element
        'target',
      ],
    })
    // sys = <|>s<|>ystem {
    await completion({
      text,
      index: 4,
      expectedItems: ['actor', 'system'],
    })
    await completion({
      text,
      index: 5,
      expectedItems: ['system'],
    })
    // -> <|>customer
    await completion({
      text,
      index: 6,
      expectedItems: [
        'this',
        'it',
        'customer',
        'sys',
      ],
    })
  })

  it('should suggest keywords inside element', async ({ expect }) => {
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
          <|>#tag1 #tag2 #<|>tag3
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
          'title',
          'technology',
          'description',
          'link',
          'style',
          'actor',
          'system',
          'metadata',
        ])
        expect(labels).not.to.include.members(['extend'])
      },
    })
    await completion({
      text,
      index: 1,
      assert: completions => {
        expect(completions.items).not.to.be.empty
        const labels = pluck('label', completions.items)
        expect(labels).to.include.members([
          'tag1',
          'tag2',
          'tag3',
        ])
        expect(labels).not.to.include.members(['extend'])
      },
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
          'system',
        ])
      },
    })
  })

  it.todo('should suggest relationship kind after dot', async ({ expect }) => {
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
        '.uses',
      ],
    })
  })

  it('should suggest nested elements for fqnref', async ({ expect }) => {
    const text = `
      specification {
        element component
      }
      model {
        root = component {
          c1 = component {
            c2 = component {
              unique = component
              notunique = component
            }
            notunique = component

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
      expectedItems: [
        'this',
        'it',
        'root',
        'cloud',
        'cloud2',
        'c1',
        'c2',
        'unique',
      ],
      disposeAfterCheck: true,
    })
    await completion({
      text,
      index: 1,
      expectedItems: ['c1', 'c2', 'unique'],
      disposeAfterCheck: true,
    })
    await completion({
      text,
      index: 2,
      expectedItems: ['c2', 'unique'],
      disposeAfterCheck: true,
    })
    await completion({
      text,
      index: 3,
      expectedItems: ['notunique', 'unique'],
    })
  })
  it('should suggest nested elements inside view predicates', async ({ expect }) => {
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
          <|>include
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
        'title',
        'description',
        'link',
        'include',
        'exclude',
        'global',
        'group',
        'style',
        'autoLayout',
        'rank',
      ],
      disposeAfterCheck: true,
    })
    await completion({
      text,
      index: 1,
      expectedItems: [
        'root',
        'a',
        'b1',
        'b2',
        'element.tag',
        'element.kind',
      ],
      disposeAfterCheck: true,
    })
    await completion({
      text,
      index: 2,
      expectedItems: ['a', 'b1', 'b2'],
      disposeAfterCheck: true,
    })
    await completion({
      text,
      index: 3,
      expectedItems: ['b1', 'b2'],
      disposeAfterCheck: true,
    })
    await completion({
      text,
      index: 4,
      expectedItems: [
        'where',
        'with',
        'include',
        'exclude',
        'global',
        'group',
        'style',
        'autoLayout',
        'rank',
      ],
      disposeAfterCheck: true,
    })
  })

  describe('inside "where"-predicates', () => {
    const testWithText = async (text: string, expect: ExpectStatic) => {
      const completion = expectCompletion()

      await completion({
        text,
        index: 0,
        assert: completions => {
          expect(completions.items).not.to.be.empty
          const first = take(completions.items, 2)
          expect(pluck('label', first)).toEqual([
            'tag1',
            'tag2',
          ])
        },
        disposeAfterCheck: true,
      })
      await completion({
        text,
        index: 1,
        expectedItems: [
          'tag1',
          'tag2',
        ],
        disposeAfterCheck: true,
      })
      await completion({
        text,
        index: 2,
        assert: completions => {
          expect(completions.items).not.to.be.empty
          const first = take(completions.items, 2)
          expect(pluck('label', first)).toEqual([
            'service',
            'component',
          ])
        },
        disposeAfterCheck: true,
      })
    }

    it('should suggest tags and kinds inside "where"-predicates', async ({ expect }) => {
      expect.hasAssertions()
      await testWithText(
        `
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
                tag == #<|>tag1 and
                tag is not #<|>tag2 or
                kind != <|>service
              )
          }
        }
      `,
        expect,
      )
    })

    it('should suggest tags and kinds inside "where"-predicates inside groups', async ({ expect }) => {
      expect.hasAssertions()
      await testWithText(
        `
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
            group {
              include
                * where (
                  tag == #<|>tag1 and
                  tag is not #<|>tag2 or
                  kind != <|>service
                )
            }
          }
        }
      `,
        expect,
      )
    })
  })

  it('should suggest views for navigateTo', async ({ expect }) => {
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
        'global',
        'group',
        'style',
        'autoLayout',
        'rank',
      ],
      disposeAfterCheck: true,
    })
    await completion({
      text,
      index: 1,
      expectedItems: [
        'navigateTo',
        'title',
        'description',
        'technology',
        'summary',
        'notation',
        'color',
        'shape',
        'border',
        'opacity',
        'icon',
        'multiple',
        'size',
        'padding',
        'textSize',
      ],
      disposeAfterCheck: true,
    })
    await completion({
      text,
      index: 2,
      expectedItems: ['index', 'view2', 'view3'],
      disposeAfterCheck: true,
    })
  })

  it('should suggest dynamic views for navigateTo', async ({ expect }) => {
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
        dynamic view view3 { // should also suggest dynamic views
        }
        view {
          include root -> * <|>with {
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
        'global',
        'group',
        'style',
        'autoLayout',
        'rank',
      ],
      disposeAfterCheck: true,
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
        'notes',
        'color',
        'line',
        'head',
        'tail',
      ],
      disposeAfterCheck: true,
    })
    await completion({
      text,
      index: 2,
      expectedItems: ['view3'],
      disposeAfterCheck: true,
    })
  })

  it('should suggest variants for dynamic view', async ({ expect }) => {
    const text = `
      specification {
        element component
      }
      views {
        view index {
          include *
        }
        dynamic view view3 {
          variant <|>
        }
      }
    `
    const completion = expectCompletion()

    await completion({
      text,
      index: 0,
      expectedItems: [
        'diagram',
        'sequence',
      ],
      disposeAfterCheck: true,
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
          #<|>deprecated
          -> c1 #<|>
        }
      }

    `
    const completion = expectCompletion()

    // #<|>deprecated
    await completion({
      text,
      index: 0,
      expectedItems: ['deprecated', 'experimental'],
    })
    // > c1 <|>
    await completion({
      text,
      index: 1,
      assert: completions => {
        expect(completions.items).not.to.be.empty
        const first = take(completions.items, 2)
        expect(pluck('label', first)).toEqual([
          'deprecated',
          'experimental',
        ])
      },
      disposeAfterCheck: true,
    })
  })

  it('should suggest deployments', async ({ expect }) => {
    const text = `
      specification {
        element component
        deploymentNode env
        deploymentNode node
      }
      model {
        c1 = component {
          c2 = component
        }
        c2 = component {
          c1 = component
        }
      }
      deployment {
        <|>env dev {
          n1 = node
          n2 = <|>node
          i1 = instanceOf <|>
        }
        dev.<|> -> <|>
      }
      views {
        deployment view test {
          include
            <|>,
            -> dev.<|>
        }
      }
    `
    const completion = expectCompletion()

    await completion({
      text,
      index: 0,
      assert: completions => {
        expect(completions.items).not.to.be.empty
        expect(pluck('label', completions.items)).to.include.members(['env', 'node'])
      },
      disposeAfterCheck: true,
    })

    await completion({
      text,
      index: 1,
      expectedItems: [
        'env',
        'node',
      ],
      disposeAfterCheck: true,
    })

    // TODO fix completion
    // await completion({
    //   text,
    //   index: 2,
    //   expectedItems: [
    //     'c1',
    //     'c2',
    //   ],
    //   disposeAfterCheck: true,
    // })

    await completion({
      text,
      index: 3,
      expectedItems: [
        'i1',
        'n1',
        'n2',
      ],
      disposeAfterCheck: true,
    })

    await completion({
      text,
      index: 4,
      expectedItems: [
        'dev',
        'n1',
        'n2',
        'i1',
      ],
      disposeAfterCheck: true,
    })

    await completion({
      text,
      index: 5,
      expectedItems: [
        'dev',
        'n1',
        'n2',
        'i1',
        'c1',
        'c2',
        // Because of ElementTagExpression and ElementKindExpression
        'element.tag',
        'element.kind',
      ],
      disposeAfterCheck: true,
    })

    // TODO: stopped working in tests but same exampel works in runtime
    // await completion({
    //   text,
    //   index: 6,
    //   parseOptions: {
    //     validation: false
    //   },
    //   expectedItems: [
    //     'i1',
    //     'n1',
    //     'n2',
    //   ],
    // })
  })

  it('should suggest imports', async ({ expect }) => {
    const { services, validateAll } = await createMultiProjectTestServices({
      project1: {
        'doc1': `
          specification {
            element component
          }
          model {
            component e1
            component c1
            component c2
          }
        `,
      },
      project2: {
        'doc1': `
          specification {
            element component
          }
        `,
      },
    })
    const { errors } = await validateAll()
    expect(errors).toEqual([])
    const completion = langiumExpectCompletion(services)

    const text = `
      import <|>c<|>1, <|> from 'project1'
    `
    await completion({
      text,
      index: 0,
      parseOptions: {
        documentUri: 'file:///test/workspace/src/project2/doc2.c4',
      },
      expectedItems: [
        'c1',
        'c2',
        'e1',
      ],
      disposeAfterCheck: true,
    })

    await completion({
      text,
      index: 1,
      parseOptions: {
        documentUri: 'file:///test/workspace/src/project2/doc2.c4',
      },
      expectedItems: [
        'c1',
        'c2',
      ],
      disposeAfterCheck: true,
    })

    await completion({
      text,
      index: 2,
      parseOptions: {
        documentUri: 'file:///test/workspace/src/project2/doc2.c4',
      },
      expectedItems: [
        'c1',
        'c2',
        'e1',
      ],
    })
  })

  it('should suggest imports within {}', async ({ expect }) => {
    const { services, validateAll } = await createMultiProjectTestServices({
      project1: {
        'doc1': `
          specification {
            element component
          }
          model {
            component e1
            component c1
            component c2
          }
        `,
      },
      project2: {
        'doc1': `
          specification {
            element component
          }
        `,
      },
    })
    const { errors } = await validateAll()
    expect(errors).toEqual([])
    const completion = langiumExpectCompletion(services)

    const text = `
      import { <|> } from 'project1'
    `
    await completion({
      text,
      index: 0,
      parseOptions: {
        documentUri: 'file:///test/workspace/src/project2/doc2.c4',
      },
      expectedItems: [
        'c1',
        'c2',
        'e1',
      ],
    })
  })
})
