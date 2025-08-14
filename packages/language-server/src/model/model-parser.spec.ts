import {
  type ViewRulePredicate,
  isViewRulePredicate,
  ModelRelationExpr,
} from '@likec4/core'
import { indexBy } from 'remeda'
import { describe, it } from 'vitest'
import { createTestServices } from '../test'

describe.concurrent('LikeC4ModelParser', () => {
  it('parses strings with escaped quotes', async ({ expect }) => {
    const { validate, services } = createTestServices()
    const { document } = await validate(`
        specification {
          element el1 {
            technology "\\"container\\""
            notation "
              \\"C4 Container\\"
            "
          }
          element el2 {
            technology '\\'container\\''
            notation '
              \\'C4 Container\\'
            '
          }
        }
      `)
    const doc = services.likec4.ModelParser.parse(document)
    expect(doc.c4Specification).toMatchObject({
      elements: {
        el1: {
          technology: '"container"',
          notation: `"C4 Container"`,
        },
        el2: {
          technology: `'container'`,
          notation: `'C4 Container'`,
        },
      },
    })
  })

  it('parses strings with triple quotes', async ({ expect }) => {
    const { validate, services } = createTestServices()
    const { document } = await validate(`
        specification {
          element element
        }
        model {
           element el1 {
            description '''
              el1-tech
            '''
            element el11 {
              // Should treat internal quotes as part of the string
              description '''
                el'1-n'ota"tion
              '''
            }
          }
          element el2 {
            description """
              el2-tech
            """
            element el21 {
              // Should treat internal quotes as part of the string
              description """
                el"2-n"ota'tion
              """
            }
        }
      `)
    const doc = services.likec4.ModelParser.parse(document)
    expect(doc.c4Elements).toMatchObject([
      {
        id: 'el1',
        kind: 'element',
        description: { md: 'el1-tech' },
      },
      {
        id: 'el2',
        kind: 'element',
        description: { md: 'el2-tech' },
      },
      {
        id: 'el1.el11',
        kind: 'element',
        description: { md: 'el\'1-n\'ota"tion' },
      },
      {
        id: 'el2.el21',
        kind: 'element',
        description: { md: 'el"2-n"ota\'tion' },
      },
    ])
  })

  describe('specification', () => {
    it('parses custom colors', async ({ expect }) => {
      const { validate, services } = createTestServices()
      const { document } = await validate(`
        specification {
          color customcolor1 #00ffff
          color customcolor2 rgb(201 200 6)
          color customcolor3 rgba(201, 6, 6, 0.9)
          color customcolor4 rgba(201 200 6 80%)
        }
      `)
      const doc = services.likec4.ModelParser.parse(document)
      expect(doc.c4Specification).toMatchObject({
        colors: {
          customcolor1: {
            color: '#00ffff',
          },
          customcolor2: {
            color: 'rgb(201,200,6)',
          },
          customcolor3: {
            color: 'rgba(201,6,6,0.9)',
          },
          customcolor4: {
            color: 'rgba(201,200,6,0.8)',
          },
        },
      })
    })

    it('parses tags in elements', async ({ expect }) => {
      const { validate, services } = createTestServices()
      const { document } = await validate(`
        specification {
          element system {
            #tag1 #tag2
          }
          deploymentNode vm {
            #tag2
          }
          tag tag1
          tag tag2
        }
      `)
      const doc = services.likec4.ModelParser.parse(document)
      expect(doc.c4Specification).toMatchObject({
        elements: {
          system: {
            tags: ['tag1', 'tag2'],
          },
        },
        deployments: {
          vm: {
            tags: ['tag2'],
          },
        },
        tags: {
          tag1: {
            astPath: expect.any(String),
          },
          tag2: {
            astPath: expect.any(String),
          },
        },
      })
    })

    it('parses tags specification', async ({ expect }) => {
      const { validate, services } = createTestServices()
      const { document } = await validate(`
        specification {
          tag tag1
          tag tag2 {
            color #3094FEB9
          }
          tag tag3 {
            color rgba(255, 255, 255, 0.123)
          }
          tag tag4 {
            color rgba(200, 200, 200, 55%)
          }
        }
      `)
      const doc = services.likec4.ModelParser.parse(document)
      expect(doc.c4Specification).toMatchObject({
        tags: {
          tag1: {
            astPath: expect.any(String),
          },
          tag2: {
            astPath: expect.any(String),
            color: '#3094FEB9',
          },
          tag3: {
            astPath: expect.any(String),
            color: 'rgba(255,255,255,0.123)',
          },
          tag4: {
            astPath: expect.any(String),
            color: 'rgba(200,200,200,0.55)',
          },
        },
      })
    })
  })

  describe('logical model', () => {
    it('parses styles', async ({ expect }) => {
      const { validate, services } = createTestServices()
      const { document } = await validate(`
        specification {
          element system {
            style {
              multiple true
            }
          }
          element component
        }
        model {
          system sys {
            component c1 {
              style {
                multiple true
              }
              component c2 {
                style {
                  multiple false
                }
              }

            }
          }
        }
      `)
      const doc = services.likec4.ModelParser.parse(document)
      expect(doc.c4Elements).toHaveLength(3)
      expect(doc.c4Specification).toMatchObject({
        elements: {
          system: {
            style: {
              multiple: true,
            },
          },
          component: {},
        },
      })
      expect(doc.c4Specification.elements).not.toHaveProperty(['component', 'style', 'multiple'])
      expect(doc.c4Elements).toMatchObject([
        {
          'id': 'sys',
          'kind': 'system',
          'title': 'sys',
        },
        {
          'id': 'sys.c1',
          'kind': 'component',
          'style': {
            'multiple': true,
          },
          'title': 'c1',
        },
        {
          'id': 'sys.c1.c2',
          'kind': 'component',
          'style': {
            'multiple': false,
          },
          'title': 'c2',
        },
      ])
    })

    it('parses relative icons', async ({ expect }) => {
      const { validate, services } = createTestServices()
      // vscode-vfs://host/virtual/src/somefolder/index.c4
      const { document } = await validate(
        `
          specification {
            element component
          }
          model {
            component c1 {
              style {
                icon ./icon1.png
              }
            }
            component c2 {
              style {
                icon ../icon1.png
              }
              icon ../icon2.png // override
            }
          }
        `,
        'somefolder/index.c4',
      )
      const doc = services.likec4.ModelParser.parse(document)
      expect(doc.c4Elements).toMatchObject([
        {
          'id': 'c1',
          'kind': 'component',
          'style': {
            'icon': 'file:///test/workspace/src/somefolder/icon1.png',
          },
          'title': 'c1',
        },
        {
          'id': 'c2',
          'kind': 'component',
          'style': {
            'icon': 'file:///test/workspace/src/icon2.png',
          },
          'title': 'c2',
        },
      ])
    })

    it('transforms multi-line view title to single line', async ({ expect }) => {
      const { validate, services } = createTestServices()
      const { document, errors } = await validate(`
        specification {
          element component
          deploymentNode node
        }
        model {
          component c1
        }
        deployment {
          node n1
        }
        views {
          view v1 {
            title 'Line 1
            Line 2'
            include *
          }

          dynamic view v2 {
            title '
              Line 1
              Line 2
            '
          }

          deployment view v3 {
            title '''
              **Line 1**
              Line 2
             '''
          }
        }
      `)
      expect(errors).toEqual([])
      const doc = services.likec4.ModelParser.parse(document)
      const views = indexBy(doc.c4Views, ({ id }) => id as 'v1' | 'v2' | 'v3')

      expect(views.v1).toBeDefined()
      expect(views.v1!.title).toBe('Line 1     Line 2')

      expect(views.v2).toBeDefined()
      expect(views.v2!.title, 'remove indents').toEqual('Line 1 Line 2')
      expect(views.v3).toBeDefined()
      expect(views.v3).toBeDefined()
      expect(views.v3!.title, ` markdown to single line`).toEqual('**Line 1** Line 2')
    })
  })

  describe('relation predicate', () => {
    it('combined of "with" and "where"', async ({ expect }) => {
      const { parse, services } = createTestServices()
      const langiumDocument = await parse(`
        specification {
          element e
          relationship r
        }
        model {
        }
        views {
          view index {
            include * -> * where kind = r with { color red }
          }
        }
        `)

      const doc = services.likec4.ModelParser.parse(langiumDocument)!

      const rules = doc?.c4Views?.[0]?.rules!
      const includeRule = rules[0] as ViewRulePredicate
      const withPredicate = includeRule.include?.[0] as ModelRelationExpr.Custom

      expect(isViewRulePredicate(includeRule)).toBe(true)
      expect(ModelRelationExpr.isCustom(withPredicate)).toBe(true)
      expect(ModelRelationExpr.isWhere(withPredicate.customRelation.expr)).toBe(true)
      expect(withPredicate).toStrictEqual({
        customRelation: {
          color: 'red',
          expr: {
            where: {
              condition: {
                kind: { eq: 'r' },
              },
              expr: {
                isBidirectional: false,
                source: { wildcard: true },
                target: { wildcard: true },
              },
            },
          },
        },
      })
    })

    it('"where"', async ({ expect }) => {
      const { parse, services } = createTestServices()
      const langiumDocument = await parse(`
          specification {
            element e
            relationship r
          }
          model {
          }
          views {
            view index {
              include * -> * where kind = r and source.kind = e
            }
          }
          `)

      const doc = services.likec4.ModelParser.parse(langiumDocument)!

      const rules = doc?.c4Views?.[0]?.rules!
      const includeRule = rules[0] as ViewRulePredicate
      const wherePredicate = includeRule.include?.[0] as ModelRelationExpr.Where

      expect(isViewRulePredicate(includeRule)).toBe(true)
      expect(ModelRelationExpr.isWhere(wherePredicate)).toBe(true)
      expect(wherePredicate).toStrictEqual({
        where: {
          condition: {
            and: [{
              kind: { eq: 'r' },
            }, {
              participant: 'source',
              operator: {
                kind: { eq: 'e' },
              },
            }],
          },
          expr: {
            isBidirectional: false,
            source: { wildcard: true },
            target: { wildcard: true },
          },
        },
      })
    })

    it('"with"', async ({ expect }) => {
      const { parse, services } = createTestServices()
      const langiumDocument = await parse(`
        specification {
          element e
          relationship r
        }
        model {
        }
        views {
          view index {
            include * -> * with { color red }
          }
        }
      `)

      const doc = services.likec4.ModelParser.parse(langiumDocument)

      const rules = doc.c4Views[0]?.rules!
      const includeRule = rules[0] as ViewRulePredicate
      const withPredicate = includeRule.include?.[0] as ModelRelationExpr.Custom

      expect(isViewRulePredicate(includeRule)).toBe(true)
      expect(ModelRelationExpr.isCustom(withPredicate)).toBe(true)
      expect(withPredicate).toStrictEqual({
        customRelation: {
          color: 'red',
          expr: {
            isBidirectional: false,
            source: { wildcard: true },
            target: { wildcard: true },
          },
        },
      })
    })

    describe('inline kind', () => {
      it('adds condition on kind', async ({ expect }) => {
        const { parse, services } = createTestServices()
        const langiumDocument = await parse(`
          specification {
            element e
            relationship r
          }
          model {
          }
          views {
            view index {
              include * -[r]-> *
            }
          }
        `)

        const doc = services.likec4.ModelParser.parse(langiumDocument)

        const rules = doc.c4Views[0]?.rules!
        const includeRule = rules[0] as ViewRulePredicate
        const wherePredicate = includeRule.include?.[0] as ModelRelationExpr.Where

        expect(isViewRulePredicate(includeRule)).toBe(true)
        expect(wherePredicate).toStrictEqual({
          where: {
            condition: {
              kind: { eq: 'r' },
            },
            expr: {
              isBidirectional: false,
              source: { wildcard: true },
              target: { wildcard: true },
            },
          },
        })
      })
      it('can be conbined with "where"', async ({ expect }) => {
        const { parse, services } = createTestServices()
        const langiumDocument = await parse(`
          specification {
            element e
            relationship r
            tag alpha
          }
          model {
          }
          views {
            view index {
              include * -[r]-> * where tag is #alpha
            }
          }
        `)

        const doc = services.likec4.ModelParser.parse(langiumDocument)

        const rules = doc.c4Views[0]?.rules!
        const includeRule = rules[0] as ViewRulePredicate
        const wherePredicate = includeRule.include?.[0] as ModelRelationExpr.Where

        expect(isViewRulePredicate(includeRule)).toBe(true)
        expect(wherePredicate).toStrictEqual({
          where: {
            condition: {
              and: [{
                kind: { eq: 'r' },
              }, {
                tag: { eq: 'alpha' },
              }],
            },
            expr: {
              isBidirectional: false,
              source: { wildcard: true },
              target: { wildcard: true },
            },
          },
        })
      })
      it('can be conbined with "with"', async ({ expect }) => {
        const { parse, services } = createTestServices()
        const langiumDocument = await parse(`
          specification {
            element e
            relationship r
            tag alpha
          }
          model {
          }
          views {
            view index {
              include * -[r]-> * with { color red }
            }
          }
        `)

        const doc = services.likec4.ModelParser.parse(langiumDocument)

        const rules = doc.c4Views[0]?.rules!
        const includeRule = rules[0] as ViewRulePredicate
        const wherePredicate = includeRule.include?.[0] as ModelRelationExpr.Where

        expect(isViewRulePredicate(includeRule)).toBe(true)
        expect(wherePredicate).toStrictEqual({
          customRelation: {
            color: 'red',
            expr: {
              where: {
                condition: {
                  kind: { eq: 'r' },
                },
                expr: {
                  isBidirectional: false,
                  source: { wildcard: true },
                  target: { wildcard: true },
                },
              },
            },
          },
        })
      })
    })
  })

  describe('deployment model', () => {
    it('parses styles of specification ', async ({ expect }) => {
      const { parse, services } = createTestServices()
      const langiumDocument = await parse(`
        specification {
          element component
          deploymentNode node
          deploymentNode nodes {
            style {
              multiple true
            }
          }
        }
      `)
      const doc = services.likec4.ModelParser.parse(langiumDocument)
      expect(doc.c4Specification).toMatchObject({
        elements: {
          component: {},
        },
        deployments: {
          nodes: {
            style: {
              multiple: true,
            },
          },
          node: {},
        },
      })
      expect(doc.c4Specification.deployments).not.toHaveProperty(['node', 'style', 'multiple'])
    })

    it('parses styles', async ({ expect }) => {
      const { parse, services } = createTestServices()
      const langiumDocument = await parse(`
        specification {
          element component
          deploymentNode node
        }
        model {
          component sys {
            component c1 {
              component c2
            }
          }
        }
        deployment {
          node n1 {
            instanceOf sys.c1 {
              style {
                multiple true
              }
            }
          }
          node n2 {
            instanceOf sys.c2
          }
          node n3 {
            style {
              multiple true
            }
          }
        }
      `)
      const doc = services.likec4.ModelParser.parse(langiumDocument)
      expect(doc.c4Deployments).toMatchObject([
        {
          'id': 'n1',
          'kind': 'node',
          'style': {},
          'title': 'n1',
        },
        {
          'id': 'n2',
          'kind': 'node',
          'style': {},
          'title': 'n2',
        },
        {
          'id': 'n3',
          'kind': 'node',
          'style': {
            'multiple': true,
          },
          'title': 'n3',
        },
        {
          'element': {
            model: 'sys.c1',
          },
          'id': 'n1.c1',
          'style': {
            'multiple': true,
          },
        },
        {
          'element': {
            model: 'sys.c1.c2',
          },
          'id': 'n2.c2',
          'style': {},
        },
      ])
    })

    it('parses deployment relation', async ({ expect }) => {
      const { parse, services } = createTestServices()
      const langiumDocument = await parse(`
        specification {
          element component
          deploymentNode node
          tag next
        }
        model {
          component sys {
            component c1 {
              component c2
            }
          }
        }
        deployment {
          node n1 {
            sys1 = instanceOf sys
          }
          node n2 {
            sys2 = instanceOf sys
          }

          n1 -> n2
          sys1 -> sys2 {
            title 'Nested'
            style {
              color red
            }
          }
          n1.sys1 -> n2.sys2.c1 'title'
          sys1.c1 -> sys2.c2 {
            #next
          }
        }
      `)
      const doc = services.likec4.ModelParser.parse(langiumDocument)
      expect(doc.c4DeploymentRelations).toHaveLength(4)
      expect(doc.c4DeploymentRelations).toEqual([
        {
          id: expect.any(String),
          astPath: expect.any(String),
          source: {
            deployment: 'n1',
          },
          target: {
            deployment: 'n2',
          },
        },
        {
          id: expect.any(String),
          astPath: expect.any(String),
          source: {
            deployment: 'n1.sys1',
          },
          target: {
            deployment: 'n2.sys2',
          },
          title: 'Nested',
          color: 'red',
        },
        {
          id: expect.any(String),
          astPath: expect.any(String),
          source: {
            deployment: 'n1.sys1',
          },
          target: {
            deployment: 'n2.sys2',
            element: 'sys.c1',
          },
          title: 'title',
        },
        {
          id: expect.any(String),
          astPath: expect.any(String),
          source: {
            deployment: 'n1.sys1',
            element: 'sys.c1',
          },
          target: {
            deployment: 'n2.sys2',
            element: 'sys.c1.c2',
          },
          tags: ['next'],
        },
      ])
    })

    it('parses targets of deployment view rule style', async ({ expect }) => {
      const { parse, services } = createTestServices()
      const langiumDocument = await parse(`
        specification {
          deploymentNode node
        }
        deployment {
          node n1
          node n2
        }
        views {
          deployment view test {
            style n1.*, n2._, n1 {
              color red
            }
          }
        }
      `)
      const doc = services.likec4.ModelParser.parse(langiumDocument)
      expect(doc.c4Views).toHaveLength(1)
      expect(doc.c4Views[0]!.rules).toEqual([{
        style: {
          color: 'red',
        },
        targets: [
          {
            selector: 'children',
            ref: {
              deployment: 'n1',
            },
          },
          {
            selector: 'expanded',
            ref: {
              deployment: 'n2',
            },
          },
          {
            ref: {
              deployment: 'n1',
            },
          },
        ],
      }])
    })

    it('scope: prioritizes deployment nodes', async ({ expect }) => {
      const { parse, services } = createTestServices()
      const langiumDocument = await parse(`
        specification {
          element element
          deploymentNode node
        }
        model {
          element root
        }
        deployment {
          node root {
            instanceOf root
          }
          node nd {
            instanceOf root
          }
        }
        views {
          deployment view test {
            include * -> root
          }
        }
      `)
      const doc = services.likec4.ModelParser.parse(langiumDocument)
      expect(doc.c4Views).toHaveLength(1)
      expect(doc.c4Views[0]!.rules).toEqual([{
        include: [{
          isBidirectional: false,
          source: {
            wildcard: true,
          },
          target: {
            ref: {
              deployment: 'root',
            },
          },
        }],
      }])
    })

    it('scope: prioritizes deployment instances', async ({ expect }) => {
      const { parse, services } = createTestServices()
      const langiumDocument = await parse(`
        specification {
          element element
          deploymentNode node
        }
        model {
          element root
        }
        deployment {
          node nd {
            instanceOf root
          }
        }
        views {
          deployment view test {
            include * -> root,
          }
        }
      `)
      const doc = services.likec4.ModelParser.parse(langiumDocument)
      expect(doc.c4Views).toHaveLength(1)
      expect(doc.c4Views[0]!.rules).toEqual([{
        include: [{
          isBidirectional: false,
          source: {
            wildcard: true,
          },
          target: {
            ref: {
              deployment: 'nd.root',
            },
          },
        }],
      }])
    })

    it('scope: resolves to model', async ({ expect }) => {
      const { parse, services } = createTestServices()
      const langiumDocument = await parse(`
        specification {
          element element
          deploymentNode node
        }
        model {
          element root
        }
        deployment {
          node nd {
            ins = instanceOf root
          }
        }
        views {
          deployment view test {
            include * -> root
          }
        }
      `)
      const doc = services.likec4.ModelParser.parse(langiumDocument)
      expect(doc.c4Views).toHaveLength(1)
      expect(doc.c4Views[0]!.rules).toEqual([{
        include: [{
          isBidirectional: false,
          source: {
            wildcard: true,
          },
          target: {
            ref: {
              model: 'root',
            },
          },
        }],
      }])
    })

    describe('should parse predicates', () => {
      it('relations', async ({ expect }) => {
        const { parse, services } = createTestServices()
        const langiumDocument = await parse(`
        specification {
          element element
          deploymentNode node
          relationship r
        }
        model {
          element root {
            element child1
            element child2
          }
        }
        deployment {
          node nd {
            ins = instanceOf root
          }
        }
        views {
          deployment view test {
            include
              ins.child1 <-> child2,
          }
        }
      `)
        const doc = services.likec4.ModelParser.parse(langiumDocument)
        expect(doc.c4Views).toHaveLength(1)
        expect(doc.c4Views[0]!.rules).toEqual([{
          include: [{
            isBidirectional: true,
            source: {
              ref: {
                deployment: 'nd.ins',
                element: 'root.child1',
              },
            },
            target: {
              ref: {
                model: 'root.child2',
              },
            },
          }],
        }])
      })
      it('relation with dot-kind', async ({ expect }) => {
        const { parse, services } = createTestServices()
        const langiumDocument = await parse(`
        specification {
          element element
          deploymentNode node
          relationship r
        }
        model {
          element root {
            element child1
            element child2
          }
        }
        deployment {
          node nd {
            ins = instanceOf root
          }
        }
        views {
          deployment view test {
            include ins.child1 .r child2
          }
        }
      `)
        const doc = services.likec4.ModelParser.parse(langiumDocument)
        expect(doc.c4Views).toHaveLength(1)
        expect(doc.c4Views[0]!.rules).toEqual([{
          include: [{
            where: {
              condition: {
                kind: {
                  eq: 'r',
                },
              },
              expr: {
                isBidirectional: false,
                source: {
                  ref: {
                    deployment: 'nd.ins',
                    element: 'root.child1',
                  },
                },
                target: {
                  ref: {
                    model: 'root.child2',
                  },
                },
              },
            },
          }],
        }])
      })
      it('relation with inline kind', async ({ expect }) => {
        const { parse, services } = createTestServices()
        const langiumDocument = await parse(`
        specification {
          element element
          deploymentNode node
          relationship r
        }
        model {
          element root {
            element child1
            element child2
          }
        }
        deployment {
          node nd {
            ins = instanceOf root
          }
        }
        views {
          deployment view test {
            include ins.child1 -[r]-> child2
          }
        }
      `)
        const doc = services.likec4.ModelParser.parse(langiumDocument)
        expect(doc.c4Views).toHaveLength(1)
        expect(doc.c4Views[0]!.rules).toEqual([{
          include: [{
            where: {
              condition: {
                kind: {
                  eq: 'r',
                },
              },
              expr: {
                isBidirectional: false,
                source: {
                  ref: {
                    deployment: 'nd.ins',
                    element: 'root.child1',
                  },
                },
                target: {
                  ref: {
                    model: 'root.child2',
                  },
                },
              },
            },
          }],
        }])
      })
    })
  })

  describe('global rules', () => {
    it('parses styles', async ({ expect }) => {
      const { parse, services } = createTestServices()
      const langiumDocument = await parse(`
        global {
          styleGroup style_group_name {
            style * {
              color green
              opacity 70%
            }
          }
          style style_name * {
            multiple true
            color red
          }
        }
      `)
      const doc = services.likec4.ModelParser.parse(langiumDocument)
      expect(doc.c4Globals).toMatchObject({
        styles: {
          style_group_name: [
            {
              style: {
                color: 'green',
                opacity: 70,
              },
              targets: [
                {
                  wildcard: true,
                },
              ],
            },
          ],
          style_name: [
            {
              style: {
                color: 'red',
                multiple: true,
              },
              targets: [
                {
                  wildcard: true,
                },
              ],
            },
          ],
        },
      })
    })
  })
})
