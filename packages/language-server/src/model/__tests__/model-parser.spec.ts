import {
  type ViewRulePredicate,
  isViewRulePredicate,
  ModelRelationExpr,
} from '@likec4/core'
import { indexBy, values } from 'remeda'
import { describe, it } from 'vitest'
import { createTestServices } from '../../test'

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
            summary '''el1-tech'''
            // Should treat internal quotes as part of the string
            description '''
              el'1-n'ota"tion
              second line
            '''
          }
          element el2 {
            summary """el2-tech"""            
            // Should treat internal quotes as part of the string
            description """
              el"2-n"ota'tion
              second line
            """
          }
        }
      `)
    const doc = services.likec4.ModelParser.parse(document)
    expect(doc.c4Elements).toMatchObject([
      {
        id: 'el1',
        kind: 'element',
        summary: { md: 'el1-tech' },
        description: { md: 'el\'1-n\'ota"tion\nsecond line' },
      },
      {
        id: 'el2',
        kind: 'element',
        summary: { md: 'el2-tech' },
        description: { md: 'el"2-n"ota\'tion\nsecond line' },
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

    it('parses summary, title, description', async ({ expect }) => {
      const { validate, services } = createTestServices()
      const { document } = await validate(`
        specification {
          element system {
            summary "system summary"
            title "system title"
            description "system description"
          }
          deploymentNode vm {
            summary "vm summary"
            title "vm title"
            description "vm description"
          }
        }
      `)
      const doc = services.likec4.ModelParser.parse(document)
      expect(doc.c4Specification).toMatchObject({
        elements: {
          system: {
            summary: { txt: 'system summary' },
            title: 'system title',
            description: { txt: 'system description' },
          },
        },
        deployments: {
          vm: {
            summary: { txt: 'vm summary' },
            title: 'vm title',
            description: { txt: 'vm description' },
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
          element tagged {
            #tag1 #tag2
          }
        }
      `)
      const doc = services.likec4.ModelParser.parse(document)
      expect(doc.c4Specification).toMatchObject({
        elements: {
          tagged: {
            tags: ['tag1', 'tag2'],
          },
        },
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

    it('parses summary, title, description', async ({ expect }) => {
      const { validate, services } = createTestServices()
      const { document } = await validate(`
        specification {
          element el
        }
        model {
          el el1 {
            title "el1 title"
            summary "el1 summary"
            description "el1 description"
          }
          el el2 "el2 title" {
            title "el2 ignored title"
            summary """ el2 summary """
            description """ el2 description """
          }
          el el3 "el3 title" "el3 summary" {
            title "el2 ignored title"
            summary "el2 ignored  summary"
            description """ el3 description """
          }
        }
      `)
      const doc = services.likec4.ModelParser.parse(document)
      expect(doc.c4Elements[0]).toMatchObject({
        title: 'el1 title',
        summary: { txt: 'el1 summary' },
        description: { txt: 'el1 description' },
      })
      expect(doc.c4Elements[1]).toMatchObject({
        title: 'el2 title',
        summary: { md: 'el2 summary' },
        description: { md: 'el2 description' },
      })
      expect(doc.c4Elements[2]).toMatchObject({
        title: 'el3 title',
        summary: { txt: 'el3 summary' },
        description: { md: 'el3 description' },
      })
    })

    it('parses summary, title, description for views', async ({ expect }) => {
      const { validate, services } = createTestServices()
      const { document } = await validate(`
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
            title "View 1 Title"
            summary "View 1 summary"
            description "View 1 description"
            include *
          }

          dynamic view v2 {
            title "View 2 Title"
            summary """ View 2 summary """
            description """ View 2 description """
          }

          deployment view v3 {
            title '''View 3 Title'''
            summary '''View 3 summary'''
            description '''View 3 description'''
          }
        }
      `)
      const doc = services.likec4.ModelParser.parse(document)
      expect(doc.c4Views[0]).toMatchObject({
        title: 'View 1 Title',
        summary: { txt: 'View 1 summary' },
        description: { txt: 'View 1 description' },
      })
      expect(doc.c4Views[1]).toMatchObject({
        title: 'View 2 Title',
        summary: { md: 'View 2 summary' },
        description: { md: 'View 2 description' },
      })
      expect(doc.c4Views[2]).toMatchObject({
        title: 'View 3 Title',
        summary: { md: 'View 3 summary' },
        description: { md: 'View 3 description' },
      })
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

    it('parses sourceless relation in extended', async ({ expect }) => {
      const { validateAll, buildModel, addDocument, removeDocument } = createTestServices()
      await addDocument(`
        specification {
          element component
        }
        model {
          component sys1 {
            component a {
              component b
            }
          }
          component sys2 {
            component a {
              component b
            }
          }
        }
      `)
      let doc2 = await addDocument(`
        model {
          extend sys2.a.b {
            -> sys1.b
          }
        }
      `)

      let { errors } = await validateAll()
      expect(errors).toEqual([])
      let model = await buildModel()

      let relations = values(model.relations)
      expect(relations).toHaveLength(1)
      expect(relations[0]).toEqual({
        id: expect.any(String),
        source: {
          model: 'sys2.a.b',
        },
        target: {
          model: 'sys1.a.b',
        },
        title: '',
      })

      await removeDocument(doc2)
      doc2 = await addDocument(`
        model {
          extend sys2.a {
            it -> sys1.b
            sys1.b -> this
          }
        }
      `)

      errors = await validateAll().then(r => r.errors)
      expect(errors).toEqual([])
      model = await buildModel()

      relations = values(model.relations)
      expect(relations).toEqual([
        {
          id: expect.any(String),
          source: {
            model: 'sys2.a',
          },
          target: {
            model: 'sys1.a.b',
          },
          title: '',
        },
        {
          id: expect.any(String),
          source: {
            model: 'sys1.a.b',
          },
          target: {
            model: 'sys2.a',
          },
          title: '',
        },
      ])
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
