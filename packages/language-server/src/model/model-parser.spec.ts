import {
  type CustomRelationExpr,
  type RelationWhereExpr,
  type ViewRulePredicate,
  isCustomRelationExpr,
  isRelationWhere,
  isViewRulePredicate,
} from '@likec4/core'
import { describe, it } from 'vitest'
import { createTestServices } from '../test'

describe.concurrent('LikeC4ModelParser', () => {
  describe('parses relation predicate', () => {
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
      const withPredicate = includeRule.include?.[0] as CustomRelationExpr

      expect(isViewRulePredicate(includeRule)).toBe(true)
      expect(isCustomRelationExpr(withPredicate)).toBe(true)
      expect(isRelationWhere(withPredicate.customRelation.relation)).toBe(true)
      expect(withPredicate).toStrictEqual({
        customRelation: {
          color: 'red',
          relation: {
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
      const wherePredicate = includeRule.include?.[0] as RelationWhereExpr

      expect(isViewRulePredicate(includeRule)).toBe(true)
      expect(isRelationWhere(wherePredicate)).toBe(true)
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
      const withPredicate = includeRule.include?.[0] as CustomRelationExpr

      expect(isViewRulePredicate(includeRule)).toBe(true)
      expect(isCustomRelationExpr(withPredicate)).toBe(true)
      expect(withPredicate).toStrictEqual({
        customRelation: {
          color: 'red',
          relation: {
            isBidirectional: false,
            source: { wildcard: true },
            target: { wildcard: true },
          },
        },
      })
    })
  })

  describe('parses deployment model', () => {
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
            id: 'n1',
          },
          target: {
            id: 'n2',
          },
        },
        {
          id: expect.any(String),
          astPath: expect.any(String),
          source: {
            id: 'n1.sys1',
          },
          target: {
            id: 'n2.sys2',
          },
          title: 'Nested',
          color: 'red',
        },
        {
          id: expect.any(String),
          astPath: expect.any(String),
          source: {
            id: 'n1.sys1',
          },
          target: {
            id: 'n2.sys2',
            element: 'sys.c1',
          },
          title: 'title',
        },
        {
          id: expect.any(String),
          astPath: expect.any(String),
          source: {
            id: 'n1.sys1',
            element: 'sys.c1',
          },
          target: {
            id: 'n2.sys2',
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

    it('should parse predicates', async ({ expect }) => {
      const { parse, services } = createTestServices()
      const langiumDocument = await parse(`
        specification {
          element element
          deploymentNode node
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
            include ins.child1 <-> child2
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
  })
})
