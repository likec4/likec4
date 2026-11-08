import { expectCompletion as langiumExpectCompletion } from 'langium/test'
import assert from 'node:assert'
import { map, prop, take } from 'remeda'
import { describe } from 'vitest'
import { type CompletionList, InsertReplaceEdit } from 'vscode-languageserver-types'
import { createMultiProjectTestServices, testFileScope as test } from '../test'

function pluck<K extends keyof T, T>(property: K, list: T[]): T[K][] {
  return map(list, prop(property))
}

const it = test
  .extend('completion', async ({ t }) => {
    return langiumExpectCompletion(t.services)
  })

describe('LikeC4CompletionProvider', () => {
  it('should suggest keywords inside specification', async ({ completion }) => {
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
        'diff',
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
      expectedItems: ['title', 'description', 'technology', 'notation', 'summary', 'link', 'descriptionFile', 'style'],
    })
    await completion({
      text,
      index: 5,
      expectedItems: [
        'color',
        'shape',
        'border',
        'opacity',
        'icon',
        'iconColor',
        'multiple',
        'size',
        'padding',
        'textSize',
        'iconSize',
        'iconPosition',
        'sizing',
      ],
    })
    await completion({
      text,
      index: 6,
      expectedItems: [
        'rectangle',
        'component',
        'person',
        'browser',
        'mobile',
        'cylinder',
        'storage',
        'queue',
        'bucket',
        'document',
        'agent',
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

  it('should suggest keywords inside model', async ({ expect, completion }) => {
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
          'metadata',
          'icon',
          'this',
          'it',
          'sys',
        ])
      },
    })
    // Entered "t"
    await completion({
      text,
      index: 3,
      expectedItems: [
        'title',
        'technology',
        'this',
        // target,try and top are reserved keywords and suggested as id new element
        'target',
        'try',
        'top',
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

  it('should suggest keywords inside element', async ({ expect, completion }) => {
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
          '#tag1',
          '#tag2',
          '#tag3',
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

  it('should suggest relationship kind after dot', async ({ expect, completion }) => {
    const text = `
      specification {
        element actor
        relationship uses
      }
      model {
        actor customer {
          .u<|>
        }
      }
    `
    await completion({
      text,
      index: 0,
      expectedItems: [
        'uses',
      ],
    })
  })

  it('should suggest nested elements for fqnref', async ({ expect, completion }) => {
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
  it('should suggest nested elements inside view predicates', async ({ expect, completion }) => {
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

    await completion({
      text,
      index: 0,
      expectedItems: [
        'title',
        'description',
        'order',
        'link',
        'descriptionFile',
        'routing',
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
    const it2 = it.extend('testWithText', async ({ completion, task }) => {
      return async (text: string) => {
        return completion({
          text,
          index: 0,
          assert: completions => {
            task.context.expect(completions.items).not.to.be.empty
            const first = take(completions.items, 2)
            task.context.expect(pluck('label', first)).toEqual([
              '#tag1',
              '#tag2',
            ])
          },
          disposeAfterCheck: true,
        })
      }
    })

    it2('should suggest tags and kinds inside "where"-predicates', async ({ expect, testWithText }) => {
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
      )
    })

    it2('should suggest tags and kinds inside "where"-predicates inside groups', async ({ expect, testWithText }) => {
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
      )
    })
  })

  it('should suggest views for navigateTo', async ({ expect, completion }) => {
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
        'notes',
        'color',
        'shape',
        'border',
        'opacity',
        'icon',
        'iconColor',
        'multiple',
        'size',
        'padding',
        'textSize',
        'iconSize',
        'iconPosition',
        'sizing',
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

  it('should suggest dynamic views for navigateTo', async ({ expect, completion }) => {
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
        'multiple',
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

  it('should suggest variants for dynamic view', async ({ expect, completion }) => {
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

  it('should suggest flows in dynamic view', async ({ expect, completion }) => {
    const text = `
      specification {
        element component
        relationship uses
      }
      model {
        component a
        component b
      }
      views {
        dynamic view { // should also suggest dynamic views
          <|>a .<|>-> b
          t<|>ry {
          } <|>
          alt {
            <|>
          }
        }        
      }
    `

    await completion({
      text,
      index: 0,
      assert(completions) {
        expect(pluck('label', completions.items)).to.include.members([
          'a',
          'b',
          'opt',
          'par',
          'loop',
          'alt',
          'try',
        ])
      },
      disposeAfterCheck: true,
    })
    await completion({
      text,
      index: 1,
      expectedItems: [
        'uses',
      ],
      disposeAfterCheck: true,
    })
    await completion({
      text,
      index: 2,
      expectedItems: [
        'try',
      ],
      disposeAfterCheck: true,
    })
    await completion({
      text,
      index: 3,
      assert(completions) {
        expect(pluck('label', completions.items)).to.include.members([
          'catch',
          'finally',
        ])
      },
      disposeAfterCheck: true,
    })
    await completion({
      text,
      index: 4,
      assert(completions) {
        expect(pluck('label', completions.items)).to.include.members([
          'when',
          'if',
          'else',
        ])
      },
      disposeAfterCheck: true,
    })
  })

  it('should suggest source elements in dynamic view', async ({ expect, completion }) => {
    const text = `
      specification {
        element component
        relationship uses
      }
      model {
        component a {
          component b {
            component c
          }
        }        
      }
      views {
        dynamic view {
          <|>a.<|>b.<|>
        }        
      }
    `

    await completion({
      text,
      index: 0,
      assert(completions) {
        expect(pluck('label', completions.items)).to.include.members([
          'a',
          'b',
          'c',
        ])
      },
      disposeAfterCheck: true,
    })

    await completion({
      text,
      index: 1,
      expectedItems: [
        'b',
        'c',
      ],
      disposeAfterCheck: true,
    })

    await completion({
      text,
      index: 2,
      expectedItems: [
        'c',
      ],
    })
  })

  it('should suggest target elements in dynamic view', async ({ expect, completion }) => {
    const text = `
      specification {
        element component
        relationship uses
      }
      model {
        component a {
          component b {
            component c
          }
        }        
      }
      views {
        dynamic view {
          a.b -> <|>a.<|>b.<|>          
        }        
      }
    `

    await completion({
      text,
      index: 0,
      expectedItems: [
        'a',
        'b',
        'c',
      ],
      disposeAfterCheck: true,
    })

    await completion({
      text,
      index: 1,
      expectedItems: [
        'b',
        'c',
      ],
      disposeAfterCheck: true,
    })

    await completion({
      text,
      index: 2,
      expectedItems: [
        'c',
      ],
    })
  })

  it('should suggest tags', async ({ expect, completion }) => {
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
          -> c1 <|>
        }
        c1 -> c2 {
          <|>#<|>
        }
      }

    `

    // #<|>deprecated
    await completion({
      text,
      index: 0,
      expectedItems: [
        '#deprecated',
        '#experimental',
      ],
    })
    // > c1 <|>
    await completion({
      text,
      index: 1,
      assert: completions => {
        expect(completions.items).not.to.be.empty
        const first = take(completions.items, 4)
        expect(pluck('label', first)).toEqual([
          'deprecated',
          '#deprecated',
          'experimental',
          '#experimental',
        ])
      },
      disposeAfterCheck: true,
    })
    // c1 -> c2 {
    //  <|>#
    await completion({
      text,
      index: 2,
      assert: completions => {
        expect(completions.items).not.to.be.empty
        const first = take(completions.items, 4)
        expect(pluck('label', first)).toEqual([
          'deprecated',
          '#deprecated',
          'experimental',
          '#experimental',
        ])
      },
      disposeAfterCheck: true,
    })
    await completion({
      text,
      index: 3,
      expectedItems: [
        '#deprecated',
        '#experimental',
      ],
    })
  })

  it('should suggest deployments', async ({ expect, completion }) => {
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
    `

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
  })

  // Kept separate: completion inside deployment view predicates is expensive to parse
  it('should suggest deployments in deployment view predicates', async ({ completion }) => {
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
        env dev {
          n1 = node
          n2 = node
          i1 = instanceOf c1
        }
      }
      views {
        deployment view test {
          include
            <|>,
            -> dev.<|>
        }
      }
    `

    await completion({
      text,
      index: 0,
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
    //   index: 1,
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

  // Issue #3091 - completion items must carry an explicit textEdit,
  // otherwise clients relying on insertText duplicate the typed keyword ("modelmodel")
  it('should not duplicate typed keyword in snippet completions', async ({ expect, completion }) => {
    const text = `mod<|>`
    await completion({
      text,
      index: 0,
      assert: completions => {
        const item = completions.items.find(i => i.label === 'model')
        expect(item, 'expected a "model" completion item').toBeDefined()
        // The typed prefix `mod` must be replaced, not appended to
        expect(item!.textEdit).toEqual({
          newText: 'model {\n\t$0\n}',
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 3 },
          },
        })
        // insertText must never be the sole carrier of the snippet, otherwise
        // clients that ignore textEdit insert at the cursor and duplicate the keyword
        expect(item!.insertText).toBeUndefined()
      },
    })
  })

  it('should not duplicate typed keyword in property completions', async ({ expect, completion }) => {
    const text = `
      specification {
        element component
      }
      model {
        component c1 {
          titl<|>
        }
      }
    `
    await completion({
      text,
      index: 0,
      assert: completions => {
        const item = completions.items.find(i => i.label === 'title')
        expect(item, 'expected a "title" completion item').toBeDefined()
        // The typed prefix `titl` must be replaced, not appended to
        expect(item!.textEdit).toMatchObject({
          newText: `title '$0'`,
          range: {
            start: { line: 6, character: 10 },
            end: { line: 6, character: 14 },
          },
        })
        expect(item!.insertText).toBeUndefined()
      },
    })
  })

  it('should not duplicate typed keyword in predicate completions', async ({ expect, completion }) => {
    const text = `
      specification {
        element component
      }
      model {
        component c1
      }
      views {
        view v1 {
          inc<|>
        }
        view v2 {
          include *
          exc<|>
        }
      }
    `
    // `include` is on line 9, `exclude` on line 13
    for (const [index, [keyword, line]] of ([['include', 9], ['exclude', 13]] as const).entries()) {
      await completion({
        text,
        index,
        assert: completions => {
          const item = completions.items.find(i => i.label === keyword)
          expect(item, `expected an "${keyword}" completion item`).toBeDefined()
          // The typed 3-char prefix must be replaced, not appended to
          expect(item!.textEdit).toMatchObject({
            newText: `${keyword} `,
            range: {
              start: { line, character: 10 },
              end: { line, character: 13 },
            },
          })
          expect(item!.insertText).toBeUndefined()
        },
      })
    }
  })

  describe('element links in markdown', () => {
    const withModel = (description: string) => `
      specification {
        element system
        element component
      }
      model {
        system cloud 'Cloud' {
          component backend {
            component api 'API'
          }
        }
        system external {
          description ${description}
        }
      }
      views {
        view index {
          title 'Landscape'
        }
        dynamic view flow
      }
    `

    it('should suggest elements by full FQN and view namespace after [[', async ({ expect, completion }) => {
      await completion({
        text: withModel(`'''Calls [[<|>'''`),
        index: 0,
        expectedItems: [
          'cloud',
          'cloud.backend',
          'cloud.backend.api',
          'external',
          'view:',
        ],
      })
      await completion({
        text: withModel(`'''Calls [[<|>'''`),
        index: 0,
        assert: completions => {
          const api = completions.items.find(i => i.label === 'cloud.backend.api')
          expect(api).toMatchObject({
            detail: 'API (component)',
            filterText: 'cloud.backend.api',
            textEdit: {
              newText: 'cloud.backend.api]]',
              insert: {
                start: { line: 12, character: 33 },
                end: { line: 12, character: 33 },
              },
              replace: {
                start: { line: 12, character: 33 },
                end: { line: 12, character: 33 },
              },
            },
          })
          expect(completions.items.find(i => i.label === 'cloud.backend')?.detail).toBe('component')
          const view = completions.items.find(i => i.label === 'view:')
          expect(view).toMatchObject({
            textEdit: {
              newText: 'view:',
            },
            command: {
              command: 'editor.action.triggerSuggest',
            },
          })
        },
      })
    })

    it('should filter elements by substring over the whole FQN', async ({ expect, completion }) => {
      await completion({
        text: withModel(`'''Calls [[api<|>'''`),
        index: 0,
        assert: completions => {
          expect(completions.items.map(i => i.label)).toEqual(['cloud.backend.api'])
          expect(completions.items[0]).toMatchObject({
            // VSCode filters by the text from the start of the range to the cursor
            filterText: 'api',
            textEdit: {
              newText: 'cloud.backend.api]]',
              insert: {
                start: { line: 12, character: 33 },
                end: { line: 12, character: 36 },
              },
              replace: {
                start: { line: 12, character: 33 },
                end: { line: 12, character: 36 },
              },
            },
          })
        },
      })
      await completion({
        text: withModel(`'''Calls [[KEND<|>'''`),
        index: 0,
        assert: completions => {
          expect(completions.items.map(i => i.label)).toEqual(['cloud.backend', 'cloud.backend.api'])
          expect(completions.items.map(i => i.filterText)).toEqual(['kend', 'kend.api'])
        },
      })
      await completion({
        text: withModel(`'''Calls [[vi<|>'''`),
        index: 0,
        expectedItems: ['view:'],
      })
    })

    it('should suggest views after [[view:', async ({ expect, completion }) => {
      await completion({
        text: withModel(`'''See [[view:<|>'''`),
        index: 0,
        assert: completions => {
          expect(completions.items).toMatchObject([
            {
              label: 'index',
              detail: 'Landscape (view)',
              textEdit: {
                newText: 'index]]',
                insert: {
                  start: { line: 12, character: 36 },
                  end: { line: 12, character: 36 },
                },
                replace: {
                  start: { line: 12, character: 36 },
                  end: { line: 12, character: 36 },
                },
              },
            },
            {
              label: 'flow',
              detail: 'dynamic view',
              textEdit: {
                newText: 'flow]]',
              },
            },
          ])
        },
      })
      await completion({
        text: withModel(`'''See [[view:fl<|>'''`),
        index: 0,
        expectedItems: ['flow'],
      })
    })

    it('should not duplicate closing ]]', async ({ expect, completion }) => {
      await completion({
        text: withModel(`'''See [[cl<|>]] and [[view:<|>]]'''`),
        index: 0,
        assert: completions => {
          expect(completions.items.find(i => i.label === 'cloud')?.textEdit?.newText).toBe('cloud')
        },
      })
      await completion({
        text: withModel(`'''See [[cl<|>]] and [[view:<|>]]'''`),
        index: 1,
        assert: completions => {
          expect(completions.items.find(i => i.label === 'index')?.textEdit?.newText).toBe('index')
        },
      })
    })

    it('should replace the rest of the target in the replace mode', async ({ expect, completion }) => {
      // Line 12 is `          description '''See [[cloud.backend.ap<|>i]] and [[view:ind<|>ex|Index]]'''`
      const text = withModel(`'''See [[cloud.backend.ap<|>i]] and [[view:ind<|>ex|Index]]'''`)
      await completion({
        text,
        index: 0,
        assert: completions => {
          const api = completions.items.find(i => i.label === 'cloud.backend.api')
          expect(api?.textEdit).toEqual({
            // `]]` follows the rest of the target, so it is not added
            newText: 'cloud.backend.api',
            insert: {
              start: { line: 12, character: 31 },
              end: { line: 12, character: 47 },
            },
            replace: {
              start: { line: 12, character: 31 },
              end: { line: 12, character: 48 },
            },
          })
          const view = completions.items.find(i => i.label === 'view:')
          expect(view).toBeUndefined()
        },
      })
      await completion({
        text,
        index: 1,
        assert: completions => {
          const index = completions.items.find(i => i.label === 'index')
          expect(index?.textEdit).toEqual({
            // Rest of the target ends at the label separator, the ref is already closed
            newText: 'index',
            insert: {
              start: { line: 12, character: 62 },
              end: { line: 12, character: 65 },
            },
            replace: {
              start: { line: 12, character: 62 },
              end: { line: 12, character: 67 },
            },
          })
        },
      })
    })

    it('should not close a ref that already has a label', async ({ expect, completion }) => {
      const text = `
        specification {
          element system
        }
        model {
          system cloud {
            system api
          }
          system docs {
            description '''[[cloud.ap<|>i\\\\|API]] [[cloud.ap<|>|API]]'''
          }
        }
      `
      for (const index of [0, 1]) {
        await completion({
          text,
          index,
          assert: completions => {
            const api = completions.items.find(i => i.label === 'cloud.api')
            expect(api?.textEdit?.newText).toBe('cloud.api')
          },
        })
      }
    })

    it('should replace the rest of the target in partial and closed refs', async ({ expect, completion }) => {
      const text = `
        specification {
          element system
        }
        model {
          system cloud {
            system api
          }
          system docs {
            description '''[[cloud.ap<|>i]] [[view:ind<|>ex]] [[clo<|>ud.api]] [[cloud.api]]<|>'''
          }
        }
        views {
          view index
        }
      `
      // Typed and replaced lengths, relative to the start of both ranges (same line)
      const edit = (label: string) => (completions: CompletionList) => {
        const textEdit = completions.items.find(i => i.label === label)?.textEdit
        assert(textEdit && InsertReplaceEdit.is(textEdit), `InsertReplaceEdit for ${label}`)
        expect(textEdit.replace.start).toEqual(textEdit.insert.start)
        return {
          newText: textEdit.newText,
          typed: textEdit.insert.end.character - textEdit.insert.start.character,
          replaced: textEdit.replace.end.character - textEdit.replace.start.character,
        }
      }
      // [[cloud.ap|i]]
      await completion({
        text,
        index: 0,
        assert: completions => {
          expect(edit('cloud.api')(completions)).toEqual({ newText: 'cloud.api', typed: 8, replaced: 9 })
        },
      })
      // [[view:ind|ex]]
      await completion({
        text,
        index: 1,
        assert: completions => {
          expect(edit('index')(completions)).toEqual({ newText: 'index', typed: 3, replaced: 5 })
        },
      })
      // [[clo|ud.api]], an existing closed ref
      await completion({
        text,
        index: 2,
        assert: completions => {
          expect(edit('cloud.api')(completions)).toEqual({ newText: 'cloud.api', typed: 3, replaced: 9 })
          expect(completions.items.map(i => i.label)).not.toContain('view:')
        },
      })
      // After a closed ref, nothing to complete
      await completion({
        text,
        index: 3,
        assert: completions => {
          expect(completions.items).toEqual([])
        },
      })
    })

    it('should replace the rest of the target with the view namespace', async ({ expect, completion }) => {
      await completion({
        text: withModel(`'''See [[v<|>iew.x]]'''`),
        index: 0,
        assert: completions => {
          const view = completions.items.find(i => i.label === 'view:')
          expect(view?.textEdit).toEqual({
            newText: 'view:',
            insert: {
              start: { line: 12, character: 31 },
              end: { line: 12, character: 32 },
            },
            replace: {
              start: { line: 12, character: 31 },
              end: { line: 12, character: 37 },
            },
          })
        },
      })
    })

    it('should suggest inside """ markdown', async ({ completion }) => {
      await completion({
        text: withModel(`"""Calls [[back<|>"""`),
        index: 0,
        expectedItems: ['cloud.backend', 'cloud.backend.api'],
      })
    })

    it('should suggest in multi-line markdown', async ({ expect, completion }) => {
      await completion({
        text: withModel(`'''
            First line
            Second line, not a link [[cloud]]
            Calls [[back<|> and something
          '''`),
        index: 0,
        assert: completions => {
          expect(completions.items.map(i => i.label)).toEqual(['cloud.backend', 'cloud.backend.api'])
          expect(completions.items[0]!.textEdit).toEqual({
            newText: 'cloud.backend]]',
            insert: {
              start: { line: 15, character: 20 },
              end: { line: 15, character: 24 },
            },
            // The rest of the target ends at the space
            replace: {
              start: { line: 15, character: 20 },
              end: { line: 15, character: 24 },
            },
          })
        },
      })
    })

    it('should suggest after [[ with a DSL escape', async ({ completion }) => {
      // `\[[` in the DSL is `[[` in the model, a ref
      await completion({
        text: withModel(`'''Calls \\[[back<|>'''`),
        index: 0,
        expectedItems: ['cloud.backend', 'cloud.backend.api'],
      })
    })

    it('should not suggest outside of a link', async ({ completion }) => {
      const cases = [
        // plain strings are not processed
        `'Calls [[<|>'`,
        `"Calls [[<|>"`,
        // after a closed link
        `'''Calls [[cloud]]<|>'''`,
        `'''Calls [[cloud]] <|>'''`,
        // not a link
        `'''Calls <|>'''`,
        `'''Calls [<|>'''`,
        `'''Calls [[cloud <|>'''`,
        `'''Calls [[cloud|<|>'''`,
        // escaped in Markdown: `\\[[` in the DSL is `\[[` in the model
        `'''Calls \\\\[[<|>'''`,
        `'''Calls \\\\\\[[<|>'''`,
        // unknown namespace
        `'''Calls [[deployment:<|>'''`,
        // inside code
        `'''Calls \`[[<|>'''`,
        `'''
            \`\`\`
            [[<|>
            \`\`\`
          '''`,
      ]
      for (const description of cases) {
        await completion({
          text: withModel(description),
          index: 0,
          expectedItems: [],
          disposeAfterCheck: true,
        })
      }
    })

    it('should not suggest on [ trigger outside markdown', async ({ expect, t }) => {
      const document = await t.parse(`
        specification {
          element component
        }
        model {
          component c1 {
            metadata {
              tags [
            }
          }
        }
      `)
      const position = document.textDocument.positionAt(document.textDocument.getText().indexOf('[') + 1)
      const completions = await t.services.lsp.CompletionProvider!.getCompletion(document, {
        textDocument: { uri: document.uri.toString() },
        position,
        context: { triggerKind: 2, triggerCharacter: '[' },
      })
      expect(completions?.items).toEqual([])
    })

    it('should suggest only elements of the current project', async ({ expect }) => {
      const { services, validateAll } = await createMultiProjectTestServices({
        project1: {
          'doc1': `
            specification {
              element component
            }
            model {
              component p1el
            }
            views {
              view p1view
            }
          `,
        },
        project2: {
          'doc1': `
            specification {
              element component
            }
            model {
              component p2el {
                component nested
              }
            }
            views {
              view p2view
            }
          `,
        },
      })
      const { errors } = await validateAll()
      expect(errors).toEqual([])
      const completion = langiumExpectCompletion(services)
      const parseOptions = {
        documentUri: 'file:///test/workspace/src/project2/doc2.c4',
      }

      await completion({
        text: `
          model {
            component other {
              description '''See [[<|>'''
            }
          }
        `,
        index: 0,
        parseOptions,
        expectedItems: ['p2el', 'p2el.nested', 'other', 'view:'],
        disposeAfterCheck: true,
      })
      await completion({
        text: `
          model {
            component other {
              description '''See [[view:<|>'''
            }
          }
        `,
        index: 0,
        parseOptions,
        expectedItems: ['p2view'],
        disposeAfterCheck: true,
      })
    })
  })
})
