import * as c4 from '@likec4/core'
import { describe, expect, it } from 'vitest'
import { resolveGlobalRules } from './resolve-global-rules'

describe('resolveGlobalRulesInViews', () => {

  function generateGlobalStyles(): Record<c4.GlobalStyleID, c4.GlobalStyle> {
    const globalStyles: Record<c4.GlobalStyleID, c4.GlobalStyle> = {}

    globalStyles['empty' as c4.GlobalStyleID] = {
        id: 'empty' as c4.GlobalStyleID,
        styles: [{
            targets: [],
            style: {},
        }],
    }
    globalStyles['all' as c4.GlobalStyleID] = {
        id: 'all' as c4.GlobalStyleID,
        styles: [{
            targets: [{wildcard: true}],
            style: {color: 'amber'},
        }],
    }
    globalStyles['deprecated' as c4.GlobalStyleID] = {
        id: 'deprecated' as c4.GlobalStyleID,
        styles: [{
            targets: [{elementTag: 'deprecated' as c4.Tag, isEqual: true}],
            style: {color: 'red'},
        }],
    }
    globalStyles['multiple' as c4.GlobalStyleID] = {
        id: 'multiple' as c4.GlobalStyleID,
        styles: [{
            targets: [{elementTag: 'api' as c4.Tag, isEqual: true}],
            style: {color: 'green'},
        }, {
            targets: [{wildcard: true}],
            style: {color: 'muted'},
        }],
    }

    return globalStyles
  }

  function generateElementView(): c4.ElementView {
    return {
        id: 'viewId' as c4.ViewID,
        title: 'View Title',
        description: 'View Description',
        tags: null,
        links: null,
        customColorDefinitions: {},
        rules: [],
    }
  }

  it('should preserve styles if no global styles used', () => {
    const globalStyles = generateGlobalStyles()
    const unresolvedView: c4.ElementView = {
        ...generateElementView(),
        rules: [{
            targets: [{wildcard: true}],
            style: {color: 'green'},
        }],
    }

    const resolvedView = resolveGlobalRules(unresolvedView, globalStyles)

    expect(resolvedView.rules).toHaveLength(1)
    expect(resolvedView.rules[0]).toBeDefined()
    if (resolvedView.rules[0] === undefined) return
    expect(c4.isViewRuleStyle(resolvedView.rules[0])).toBeTruthy()
    if (!c4.isViewRuleStyle(resolvedView.rules[0])) return
    expect(resolvedView.rules[0].style).toEqual({color: 'green'})
  })

  it('should keep empty rules list if no rules defined', () => {
    const globalStyles = {}
    const unresolvedView: c4.ElementView = {
        ...generateElementView(),
        rules: [],
    }

    const resolvedView = resolveGlobalRules(unresolvedView, globalStyles)

    expect(resolvedView.rules).toHaveLength(0)
  })

  it('should replace global style id with a style', () => {
    const globalStyles = generateGlobalStyles()
    const unresolvedView: c4.ElementView = {
        ...generateElementView(),
        rules: [{
            styleId: 'all' as c4.GlobalStyleID,
        }],
    }

    const resolvedView = resolveGlobalRules(unresolvedView, globalStyles)

    expect(resolvedView.rules).toEqual(globalStyles['all' as c4.GlobalStyleID]?.styles)
  })

  it('should preserve resolved styles and replace global style', () => {
    const globalStyles = generateGlobalStyles()
    const unresolvedView: c4.ElementView = {
        ...generateElementView(),
        rules: [{
                targets: [{wildcard: true}],
                style: {color: 'secondary'},
            }, {
                styleId: 'all' as c4.GlobalStyleID,
            }, {
                targets: [{elementTag: 'new' as c4.Tag, isEqual: true}],
                style: {color: 'green'},
            }],
    }

    const resolvedView = resolveGlobalRules(unresolvedView, globalStyles)

    expect(resolvedView.rules).toHaveLength(3)

    expect(resolvedView.rules[0]).toBeDefined()
    if (resolvedView.rules[0] === undefined) return
    expect(c4.isViewRuleStyle(resolvedView.rules[0])).toBeTruthy()
    if (!c4.isViewRuleStyle(resolvedView.rules[0])) return
    expect(resolvedView.rules[0].style).toEqual({color: 'secondary'})

    expect(resolvedView.rules[1]).toBeDefined()
    if (resolvedView.rules[1] === undefined) return
    const expectedStyleList = globalStyles['all' as c4.GlobalStyleID]
    expect(expectedStyleList).toBeDefined()
    if (expectedStyleList === undefined) return
    expect(resolvedView.rules[1]).toEqual(expectedStyleList.styles[0])

    expect(resolvedView.rules[2]).toBeDefined()
    if (resolvedView.rules[2] === undefined) return
    expect(c4.isViewRuleStyle(resolvedView.rules[2])).toBeTruthy()
    if (!c4.isViewRuleStyle(resolvedView.rules[2])) return
    expect(resolvedView.rules[2].style).toEqual({color: 'green'})
  })

  it('should replace global style with all elements from the list', () => {
    const globalStyles = generateGlobalStyles()
    const unresolvedView: c4.ElementView = {
        ...generateElementView(),
        rules: [{
                targets: [{wildcard: true}],
                style: {color: 'secondary'},
            }, {
                styleId: 'multiple' as c4.GlobalStyleID,
            }, {
                targets: [{elementTag: 'new' as c4.Tag, isEqual: true}],
                style: {color: 'green'},
            }],
    }

    const resolvedView = resolveGlobalRules(unresolvedView, globalStyles)

    expect(resolvedView.rules).toHaveLength(4)

    expect(resolvedView.rules[0]).toBeDefined()
    if (resolvedView.rules[0] === undefined) return
    expect(c4.isViewRuleStyle(resolvedView.rules[0])).toBeTruthy()
    if (!c4.isViewRuleStyle(resolvedView.rules[0])) return
    expect(resolvedView.rules[0].style).toEqual({color: 'secondary'})

    expect(resolvedView.rules[1]).toBeDefined()
    if (resolvedView.rules[1] === undefined) return
    const expectedStyleList = globalStyles['multiple' as c4.GlobalStyleID]
    expect(expectedStyleList).toBeDefined()
    if (expectedStyleList === undefined) return
    expect(resolvedView.rules[1]).toEqual(expectedStyleList.styles[0])
    expect(resolvedView.rules[2]).toEqual(expectedStyleList.styles[1])

    expect(resolvedView.rules[3]).toBeDefined()
    if (resolvedView.rules[3] === undefined) return
    expect(c4.isViewRuleStyle(resolvedView.rules[3])).toBeTruthy()
    if (!c4.isViewRuleStyle(resolvedView.rules[3])) return
    expect(resolvedView.rules[3].style).toEqual({color: 'green'})
  })

  it('should remove global style that does not exist', () => {
    const globalStyles = generateGlobalStyles()
    const unresolvedView: c4.ElementView = {
        ...generateElementView(),
        rules: [{
                targets: [{wildcard: true}],
                style: {color: 'secondary'},
            }, {
                styleId: 'missingStyleId' as c4.GlobalStyleID,
            }, {
                targets: [{elementTag: 'new' as c4.Tag, isEqual: true}],
                style: {color: 'green'},
            }],
    }

    const resolvedView = resolveGlobalRules(unresolvedView, globalStyles)

    expect(resolvedView.rules).toHaveLength(2)

    expect(resolvedView.rules[0]).toBeDefined()
    if (resolvedView.rules[0] === undefined) return
    expect(c4.isViewRuleStyle(resolvedView.rules[0])).toBeTruthy()
    if (!c4.isViewRuleStyle(resolvedView.rules[0])) return
    expect(resolvedView.rules[0].style).toEqual({color: 'secondary'})

    expect(resolvedView.rules[1]).toBeDefined()
    if (resolvedView.rules[1] === undefined) return
    expect(c4.isViewRuleStyle(resolvedView.rules[1])).toBeTruthy()
    if (!c4.isViewRuleStyle(resolvedView.rules[1])) return
    expect(resolvedView.rules[1].style).toEqual({color: 'green'})
  })

  it('should preserve styles with empty global styles list', () => {
    const globalStyles = {}
    const unresolvedView: c4.ElementView = {
        ...generateElementView(),
        rules: [{
                targets: [{wildcard: true}],
                style: {color: 'secondary'},
            }, {
                targets: [{elementTag: 'new' as c4.Tag, isEqual: true}],
                style: {color: 'green'},
            }],
    }

    const resolvedView = resolveGlobalRules(unresolvedView, globalStyles)

    expect(resolvedView.rules).toHaveLength(2)

    expect(resolvedView.rules[0]).toBeDefined()
    if (resolvedView.rules[0] === undefined) return
    expect(c4.isViewRuleStyle(resolvedView.rules[0])).toBeTruthy()
    if (!c4.isViewRuleStyle(resolvedView.rules[0])) return
    expect(resolvedView.rules[0].style).toEqual({color: 'secondary'})

    expect(resolvedView.rules[1]).toBeDefined()
    if (resolvedView.rules[1] === undefined) return
    expect(c4.isViewRuleStyle(resolvedView.rules[1])).toBeTruthy()
    if (!c4.isViewRuleStyle(resolvedView.rules[1])) return
    expect(resolvedView.rules[1].style).toEqual({color: 'green'})
  })
})
