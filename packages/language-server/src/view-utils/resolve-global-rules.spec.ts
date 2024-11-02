import * as c4 from '@likec4/core'
import { describe, expect, it } from 'vitest'
import { resolveGlobalRules } from './resolve-global-rules'

describe('resolveGlobalRulesInViews', () => {
  function generateElementView(): c4.ElementView {
    return {
      id: 'viewId' as c4.ViewID,
      title: 'View Title',
      description: 'View Description',
      tags: null,
      links: null,
      customColorDefinitions: {},
      rules: []
    }
  }

  function emptyGlobals(): c4.ModelGlobals {
    return {
      predicates: {},
      dynamicPredicates: {},
      styles: {}
    }
  }

  function generateGlobals() {
    const predicates = {
      'all': [
        { include: [{ wildcard: true }] }
      ],
      'exclude_deprecated': [
        { exclude: [{ elementTag: 'deprecated' as c4.Tag, isEqual: true }] }
      ],
      'multiple': [
        { include: [{ elementTag: 'api' as c4.Tag, isEqual: true }] },
        { include: [{ element: 'backend' as c4.Fqn }] },
        { exclude: [{ elementTag: 'deprecated' as c4.Tag, isEqual: true }] }
      ],
      'relation': [{
        include: [{
          source: { element: 'source' as c4.Fqn },
          target: { element: 'target' as c4.Fqn }
        }]
      }]
    } as const

    const styles = {
      'empty': [{
        targets: [],
        style: {}
      }],
      'all': [{
        targets: [{ wildcard: true }],
        style: { color: 'amber' }
      }],
      'deprecated': [{
        targets: [{ elementTag: 'deprecated' as c4.Tag, isEqual: true }],
        style: { color: 'red' }
      }],
      'multiple': [{
        targets: [{ elementTag: 'api' as c4.Tag, isEqual: true }],
        style: { color: 'green' }
      }, {
        targets: [{ wildcard: true }],
        style: { color: 'muted' }
      }]
    } as const

    return {
      predicates,
      dynamicPredicates: {},
      styles
    } as const satisfies c4.ModelGlobals
  }

  it('should keep empty rules list if no rules defined', () => {
    const globals = emptyGlobals()
    const unresolvedView: c4.ElementView = {
      ...generateElementView(),
      rules: []
    }

    const resolvedView = resolveGlobalRules(unresolvedView, globals)

    expect(resolvedView.rules).toHaveLength(0)
  })

  it('should preserve element and relation predicates if no global predicates used', () => {
    const globals = generateGlobals()
    const unresolvedView: c4.ElementView = {
      ...generateElementView(),
      rules: [{
        include: [{ element: 'elementId' as c4.Fqn }]
      }]
    }

    const resolvedView = resolveGlobalRules(unresolvedView, globals)

    expect(resolvedView.rules).toHaveLength(1)
    expect(resolvedView.rules[0]).toBeDefined()
    if (resolvedView.rules[0] === undefined) return

    expect(c4.isViewRulePredicate(resolvedView.rules[0])).toBeTruthy()
    if (!c4.isViewRulePredicate(resolvedView.rules[0])) return

    expect(resolvedView.rules[0].include).toBeDefined()
    if (resolvedView.rules[0].include === undefined) return

    expect(resolvedView.rules[0].include).toHaveLength(1)
    expect(resolvedView.rules[0].include[0]).toBeDefined()
    if (resolvedView.rules[0].include[0] === undefined) return

    expect(resolvedView.rules[0].include[0]).toEqual({ element: 'elementId' as c4.Fqn })
  })

  it('should replace global predicate id with a predicate', () => {
    const globals = generateGlobals()
    const unresolvedView: c4.ElementView = {
      ...generateElementView(),
      rules: [{
        predicateId: 'all' as c4.GlobalPredicateId
      }]
    }

    const resolvedView = resolveGlobalRules(unresolvedView, globals)

    expect(resolvedView.rules).toEqual(globals.predicates.all)
  })

  it('should preserve resolved predicates and replace global predicate', () => {
    const globals = generateGlobals()
    const unresolvedView: c4.ElementView = {
      ...generateElementView(),
      rules: [{
        exclude: [{ elementTag: 'obsolete' as c4.Tag, isEqual: true }]
      }, {
        predicateId: 'all' as c4.GlobalPredicateId
      }, {
        include: [{ element: 'new' as c4.Fqn }]
      }]
    }

    const resolvedView = resolveGlobalRules(unresolvedView, globals)

    expect(resolvedView.rules).toHaveLength(3)

    expect(resolvedView.rules[0]).toBeDefined()
    if (resolvedView.rules[0] === undefined) return
    expect(c4.isViewRulePredicate(resolvedView.rules[0])).toBeTruthy()
    if (!c4.isViewRulePredicate(resolvedView.rules[0])) return
    expect(resolvedView.rules[0].exclude).toEqual([{ elementTag: 'obsolete' as c4.Tag, isEqual: true }])

    expect(resolvedView.rules[1]).toBeDefined()
    if (resolvedView.rules[1] === undefined) return
    const expectedPredicateList = globals.predicates.all
    expect(expectedPredicateList).toBeDefined()
    if (expectedPredicateList === undefined) return
    expect(resolvedView.rules[1]).toEqual(expectedPredicateList[0])

    expect(resolvedView.rules[2]).toBeDefined()
    if (resolvedView.rules[2] === undefined) return
    expect(c4.isViewRulePredicate(resolvedView.rules[2])).toBeTruthy()
    if (!c4.isViewRulePredicate(resolvedView.rules[2])) return
    expect(resolvedView.rules[2].include).toEqual([{ element: 'new' as c4.Fqn }])
  })

  it('should replace global predicate with all elements from the list', () => {
    const globals = generateGlobals()
    const unresolvedView: c4.ElementView = {
      ...generateElementView(),
      rules: [
        { exclude: [{ elementTag: 'obsolete' as c4.Tag, isEqual: true }] },
        { predicateId: 'multiple' as c4.GlobalPredicateId },
        { include: [{ element: 'new' as c4.Fqn }] }
      ]
    }

    const resolvedView = resolveGlobalRules(unresolvedView, globals)

    const expectedPredicateList = globals.predicates.multiple
    expect(expectedPredicateList).toBeDefined()
    if (expectedPredicateList === undefined) return

    expect(resolvedView.rules).toHaveLength(2 + expectedPredicateList.length)

    expect(resolvedView.rules[0]).toBeDefined()
    if (resolvedView.rules[0] === undefined) return
    expect(c4.isViewRulePredicate(resolvedView.rules[0])).toBeTruthy()
    if (!c4.isViewRulePredicate(resolvedView.rules[0])) return
    expect(resolvedView.rules[0].exclude).toEqual([{ elementTag: 'obsolete' as c4.Tag, isEqual: true }])

    for (let expI = 0; expI < 3; expI++) {
      expect(resolvedView.rules[expI + 1]).toBeDefined()
      if (resolvedView.rules[expI + 1] === undefined) return
      expect(resolvedView.rules[expI + 1]).toEqual(expectedPredicateList[expI])
    }

    expect(resolvedView.rules[4]).toBeDefined()
    if (resolvedView.rules[4] === undefined) return
    expect(c4.isViewRulePredicate(resolvedView.rules[4])).toBeTruthy()
    if (!c4.isViewRulePredicate(resolvedView.rules[4])) return
    expect(resolvedView.rules[4].include).toEqual([{ element: 'new' as c4.Fqn }])
  })

  it('should remove global predicate that does not exist', () => {
    const globals = generateGlobals()
    const unresolvedView: c4.ElementView = {
      ...generateElementView(),
      rules: [
        { exclude: [{ elementTag: 'obsolete' as c4.Tag, isEqual: true }] },
        { predicateId: 'missingPredicateId' as c4.GlobalPredicateId },
        { include: [{ element: 'new' as c4.Fqn }] }
      ]
    }

    const resolvedView = resolveGlobalRules(unresolvedView, globals)

    expect(resolvedView.rules).toHaveLength(2)

    expect(resolvedView.rules[0]).toBeDefined()
    if (resolvedView.rules[0] === undefined) return
    expect(c4.isViewRulePredicate(resolvedView.rules[0])).toBeTruthy()
    if (!c4.isViewRulePredicate(resolvedView.rules[0])) return
    expect(resolvedView.rules[0].exclude).toEqual([{ elementTag: 'obsolete' as c4.Tag, isEqual: true }])

    expect(resolvedView.rules[1]).toBeDefined()
    if (resolvedView.rules[1] === undefined) return
    expect(c4.isViewRulePredicate(resolvedView.rules[1])).toBeTruthy()
    if (!c4.isViewRulePredicate(resolvedView.rules[1])) return
    expect(resolvedView.rules[1].include).toEqual([{ element: 'new' as c4.Fqn }])
  })

  it('should preserve styles if no global styles used', () => {
    const globals = generateGlobals()
    const unresolvedView: c4.ElementView = {
      ...generateElementView(),
      rules: [{
        targets: [{ wildcard: true }],
        style: { color: 'green' }
      }]
    }

    const resolvedView = resolveGlobalRules(unresolvedView, globals)

    expect(resolvedView.rules).toHaveLength(1)
    expect(resolvedView.rules[0]).toBeDefined()
    if (resolvedView.rules[0] === undefined) return
    expect(c4.isViewRuleStyle(resolvedView.rules[0])).toBeTruthy()
    if (!c4.isViewRuleStyle(resolvedView.rules[0])) return
    expect(resolvedView.rules[0].style).toEqual({ color: 'green' })
  })

  it('should replace global style id with a style', () => {
    const globals = generateGlobals()
    const unresolvedView: c4.ElementView = {
      ...generateElementView(),
      rules: [{
        styleId: 'all' as c4.GlobalStyleID
      }]
    }

    const resolvedView = resolveGlobalRules(unresolvedView, globals)

    expect(resolvedView.rules).toEqual(globals.styles.all)
  })

  it('should preserve resolved styles and replace global style', () => {
    const globals = generateGlobals()
    const unresolvedView: c4.ElementView = {
      ...generateElementView(),
      rules: [{
        targets: [{ wildcard: true }],
        style: { color: 'secondary' }
      }, {
        styleId: 'all' as c4.GlobalStyleID
      }, {
        targets: [{ elementTag: 'new' as c4.Tag, isEqual: true }],
        style: { color: 'green' }
      }]
    }

    const resolvedView = resolveGlobalRules(unresolvedView, globals)

    expect(resolvedView.rules).toHaveLength(3)

    expect(resolvedView.rules[0]).toBeDefined()
    if (resolvedView.rules[0] === undefined) return
    expect(c4.isViewRuleStyle(resolvedView.rules[0])).toBeTruthy()
    if (!c4.isViewRuleStyle(resolvedView.rules[0])) return
    expect(resolvedView.rules[0].style).toEqual({ color: 'secondary' })

    expect(resolvedView.rules[1]).toBeDefined()
    if (resolvedView.rules[1] === undefined) return
    const expectedStyleList = globals.styles.all
    expect(expectedStyleList).toBeDefined()
    if (expectedStyleList === undefined) return
    expect(resolvedView.rules[1]).toEqual(expectedStyleList[0])

    expect(resolvedView.rules[2]).toBeDefined()
    if (resolvedView.rules[2] === undefined) return
    expect(c4.isViewRuleStyle(resolvedView.rules[2])).toBeTruthy()
    if (!c4.isViewRuleStyle(resolvedView.rules[2])) return
    expect(resolvedView.rules[2].style).toEqual({ color: 'green' })
  })

  it('should replace global style with all elements from the list', () => {
    const globals = generateGlobals()
    const unresolvedView: c4.ElementView = {
      ...generateElementView(),
      rules: [{
        targets: [{ wildcard: true }],
        style: { color: 'secondary' }
      }, {
        styleId: 'multiple' as c4.GlobalStyleID
      }, {
        targets: [{ elementTag: 'new' as c4.Tag, isEqual: true }],
        style: { color: 'green' }
      }]
    }

    const resolvedView = resolveGlobalRules(unresolvedView, globals)

    expect(resolvedView.rules).toHaveLength(4)

    expect(resolvedView.rules[0]).toBeDefined()
    if (resolvedView.rules[0] === undefined) return
    expect(c4.isViewRuleStyle(resolvedView.rules[0])).toBeTruthy()
    if (!c4.isViewRuleStyle(resolvedView.rules[0])) return
    expect(resolvedView.rules[0].style).toEqual({ color: 'secondary' })

    expect(resolvedView.rules[1]).toBeDefined()
    if (resolvedView.rules[1] === undefined) return
    const expectedStyleList = globals.styles.multiple
    expect(expectedStyleList).toBeDefined()
    if (expectedStyleList === undefined) return
    expect(resolvedView.rules[1]).toEqual(expectedStyleList[0])
    expect(resolvedView.rules[2]).toEqual(expectedStyleList[1])

    expect(resolvedView.rules[3]).toBeDefined()
    if (resolvedView.rules[3] === undefined) return
    expect(c4.isViewRuleStyle(resolvedView.rules[3])).toBeTruthy()
    if (!c4.isViewRuleStyle(resolvedView.rules[3])) return
    expect(resolvedView.rules[3].style).toEqual({ color: 'green' })
  })

  it('should remove global style that does not exist', () => {
    const globals = generateGlobals()
    const unresolvedView: c4.ElementView = {
      ...generateElementView(),
      rules: [{
        targets: [{ wildcard: true }],
        style: { color: 'secondary' }
      }, {
        styleId: 'missingStyleId' as c4.GlobalStyleID
      }, {
        targets: [{ elementTag: 'new' as c4.Tag, isEqual: true }],
        style: { color: 'green' }
      }]
    }

    const resolvedView = resolveGlobalRules(unresolvedView, globals)

    expect(resolvedView.rules).toHaveLength(2)

    expect(resolvedView.rules[0]).toBeDefined()
    if (resolvedView.rules[0] === undefined) return
    expect(c4.isViewRuleStyle(resolvedView.rules[0])).toBeTruthy()
    if (!c4.isViewRuleStyle(resolvedView.rules[0])) return
    expect(resolvedView.rules[0].style).toEqual({ color: 'secondary' })

    expect(resolvedView.rules[1]).toBeDefined()
    if (resolvedView.rules[1] === undefined) return
    expect(c4.isViewRuleStyle(resolvedView.rules[1])).toBeTruthy()
    if (!c4.isViewRuleStyle(resolvedView.rules[1])) return
    expect(resolvedView.rules[1].style).toEqual({ color: 'green' })
  })

  it('shold replace element, relation, and style predicates', () => {
    const globals = generateGlobals()
    const unresolvedView: c4.ElementView = {
      ...generateElementView(),
      rules: [
        { exclude: [{ elementTag: 'obsolete' as c4.Tag, isEqual: true }] },
        { predicateId: 'all' as c4.GlobalPredicateId },
        { include: [{ element: 'new' as c4.Fqn }] },
        { styleId: 'all' as c4.GlobalStyleID },
        { predicateId: 'relation' as c4.GlobalPredicateId }
      ]
    }

    const resolvedView = resolveGlobalRules(unresolvedView, globals)

    const expectedPredicateList = globals.predicates

    expect(resolvedView.rules).toHaveLength(5)

    expect(resolvedView.rules[0]).toBeDefined()
    if (resolvedView.rules[0] === undefined) return
    expect(c4.isViewRulePredicate(resolvedView.rules[0])).toBeTruthy()
    if (!c4.isViewRulePredicate(resolvedView.rules[0])) return
    expect(resolvedView.rules[0].exclude).toEqual([{ elementTag: 'obsolete' as c4.Tag, isEqual: true }])

    expect(resolvedView.rules[1]).toBeDefined()
    if (resolvedView.rules[1] === undefined) return
    const expectedPredicate = expectedPredicateList.all
    expect(expectedPredicate).toBeDefined()
    if (expectedPredicate === undefined) return
    expect(resolvedView.rules[1]).toEqual(expectedPredicate[0])

    expect(resolvedView.rules[2]).toBeDefined()
    if (resolvedView.rules[2] === undefined) return
    expect(c4.isViewRulePredicate(resolvedView.rules[2])).toBeTruthy()
    if (!c4.isViewRulePredicate(resolvedView.rules[2])) return
    expect(resolvedView.rules[2].include).toEqual([{ element: 'new' as c4.Fqn }])

    expect(resolvedView.rules[3]).toBeDefined()
    if (resolvedView.rules[3] === undefined) return
    const expectedStyleList = globals.styles.all
    expect(expectedStyleList).toBeDefined()
    if (expectedStyleList === undefined) return
    expect(resolvedView.rules[3]).toEqual(expectedStyleList[0])

    expect(resolvedView.rules[4]).toBeDefined()
    if (resolvedView.rules[4] === undefined) return
    const expectedRelationPredicate = expectedPredicateList.relation
    expect(expectedRelationPredicate).toBeDefined()
    if (expectedRelationPredicate === undefined) return
    expect(resolvedView.rules[4]).toEqual(expectedRelationPredicate[0])
  })

  it('should preserve rules if global rules list is empty', () => {
    const globals = emptyGlobals()
    const unresolvedView: c4.ElementView = {
      ...generateElementView(),
      rules: [{
        targets: [{ wildcard: true }],
        style: { color: 'secondary' }
      }, {
        targets: [{ elementTag: 'new' as c4.Tag, isEqual: true }],
        style: { color: 'green' }
      }, {
        include: [{ element: 'new' as c4.Fqn }]
      }, {
        exclude: [{ elementTag: 'obsolete' as c4.Tag, isEqual: true }]
      }]
    }

    const resolvedView = resolveGlobalRules(unresolvedView, globals)

    expect(resolvedView.rules).toHaveLength(4)

    expect(resolvedView.rules[0]).toBeDefined()
    if (resolvedView.rules[0] === undefined) return
    expect(c4.isViewRuleStyle(resolvedView.rules[0])).toBeTruthy()
    if (!c4.isViewRuleStyle(resolvedView.rules[0])) return
    expect(resolvedView.rules[0].style).toEqual({ color: 'secondary' })

    expect(resolvedView.rules[1]).toBeDefined()
    if (resolvedView.rules[1] === undefined) return
    expect(c4.isViewRuleStyle(resolvedView.rules[1])).toBeTruthy()
    if (!c4.isViewRuleStyle(resolvedView.rules[1])) return
    expect(resolvedView.rules[1].style).toEqual({ color: 'green' })

    expect(resolvedView.rules[2]).toBeDefined()
    if (resolvedView.rules[2] === undefined) return
    expect(c4.isViewRulePredicate(resolvedView.rules[2])).toBeTruthy()
    if (!c4.isViewRulePredicate(resolvedView.rules[2])) return
    expect(resolvedView.rules[2].include).toEqual([{ element: 'new' as c4.Fqn }])

    expect(resolvedView.rules[3]).toBeDefined()
    if (resolvedView.rules[3] === undefined) return
    expect(c4.isViewRulePredicate(resolvedView.rules[3])).toBeTruthy()
    if (!c4.isViewRulePredicate(resolvedView.rules[3])) return
    expect(resolvedView.rules[3].exclude).toEqual([{ elementTag: 'obsolete' as c4.Tag, isEqual: true }])
  })
})
