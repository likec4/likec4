import {
  type CustomRelationExpr,
  isCustomRelationExpr,
  isRelationWhere,
  isViewRulePredicate,
  type RelationWhereExpr,
  type ViewRulePredicate
} from '@likec4/core'
import { describe, it } from 'vitest'
import { createTestServices } from '../test'

describe.concurrent('LikeC4ModelParser', () => {
  describe('parses relation predicate', () => {
    it('comined of "with" and "where"', async ({ expect }) => {
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

      const doc = services.likec4.ModelParser.parse(langiumDocument)[0]

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
                kind: { eq: 'r' }
              },
              expr: {
                isBidirectional: false,
                source: { wildcard: true },
                target: { wildcard: true }
              }
            }
          }
        }
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
              include * -> * where kind = r
            }
          }
          `)

      const doc = services.likec4.ModelParser.parse(langiumDocument)[0]

      const rules = doc?.c4Views?.[0]?.rules!
      const includeRule = rules[0] as ViewRulePredicate
      const wherePredicate = includeRule.include?.[0] as RelationWhereExpr

      expect(isViewRulePredicate(includeRule)).toBe(true)
      expect(isRelationWhere(wherePredicate)).toBe(true)
      expect(wherePredicate).toStrictEqual({
        where: {
          condition: {
            kind: { eq: 'r' }
          },
          expr: {
            isBidirectional: false,
            source: { wildcard: true },
            target: { wildcard: true }
          }
        }
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

      const doc = services.likec4.ModelParser.parse(langiumDocument)[0]

      const rules = doc?.c4Views?.[0]?.rules!
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
            target: { wildcard: true }
          }
        }
      })
    })
  })
})
