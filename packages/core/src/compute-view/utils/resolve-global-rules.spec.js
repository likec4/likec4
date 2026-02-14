import { describe, it } from 'vitest';
import { isElementView, isViewRulePredicate, isViewRuleStyle, ViewId, } from '../../types';
import { invariant } from '../../utils';
import { resolveGlobalRules } from './resolve-global-rules';
describe('resolveGlobalRulesInViews', () => {
    function generateElementView() {
        return {
            _stage: 'parsed',
            _type: 'element',
            id: ViewId('viewId'),
            title: 'View Title',
            description: { txt: 'View Description' },
            tags: null,
            links: null,
            rules: [],
        };
    }
    function emptyGlobals() {
        return {
            predicates: {},
            dynamicPredicates: {},
            styles: {},
        };
    }
    function generateGlobals() {
        const predicates = {
            'all': [
                { include: [{ wildcard: true }] },
            ],
            'exclude_deprecated': [
                { exclude: [{ elementTag: 'deprecated', isEqual: true }] },
            ],
            'multiple': [
                { include: [{ elementTag: 'api', isEqual: true }] },
                { include: [{ element: 'backend' }] },
                { exclude: [{ elementTag: 'deprecated', isEqual: true }] },
            ],
            'relation': [{
                    include: [{
                            source: { element: 'source' },
                            target: { element: 'target' },
                        }],
                }],
        };
        const styles = {
            'empty': [{
                    targets: [],
                    style: {},
                }],
            'all': [{
                    targets: [{ wildcard: true }],
                    style: { color: 'amber' },
                }],
            'deprecated': [{
                    targets: [{ elementTag: 'deprecated', isEqual: true }],
                    style: { color: 'red' },
                }],
            'multiple': [{
                    targets: [{ elementTag: 'api', isEqual: true }],
                    style: { color: 'green' },
                }, {
                    targets: [{ wildcard: true }],
                    style: { color: 'muted' },
                }],
        };
        return {
            predicates,
            dynamicPredicates: {},
            styles,
        };
    }
    it('should keep empty rules list if no rules defined', ({ expect }) => {
        const globals = emptyGlobals();
        const unresolvedView = {
            ...generateElementView(),
            rules: [],
        };
        const resolvedView = resolveGlobalRules(unresolvedView, globals);
        expect(resolvedView.rules).toHaveLength(0);
    });
    it('should preserve element and relation predicates if no global predicates used', ({ expect }) => {
        const globals = generateGlobals();
        const unresolvedView = {
            ...generateElementView(),
            rules: [{
                    include: [{
                            ref: {
                                model: 'elementId',
                            },
                        }],
                }],
        };
        const resolvedView = resolveGlobalRules(unresolvedView, globals);
        expect(resolvedView.rules).toHaveLength(1);
        expect(resolvedView.rules[0]).toBeDefined();
        if (resolvedView.rules[0] === undefined)
            return;
        expect(isViewRulePredicate(resolvedView.rules[0])).toBeTruthy();
        if (!isViewRulePredicate(resolvedView.rules[0]))
            return;
        expect(resolvedView.rules[0].include).toBeDefined();
        if (resolvedView.rules[0].include === undefined)
            return;
        expect(resolvedView.rules[0].include).toHaveLength(1);
        expect(resolvedView.rules[0].include[0]).toBeDefined();
        if (resolvedView.rules[0].include[0] === undefined)
            return;
        expect(resolvedView.rules[0].include[0]).toEqual({
            ref: {
                model: 'elementId',
            },
        });
    });
    it('should replace global predicate id with a predicate', ({ expect }) => {
        const globals = generateGlobals();
        const unresolvedView = {
            ...generateElementView(),
            rules: [{
                    predicateId: 'all',
                }],
        };
        const resolvedView = resolveGlobalRules(unresolvedView, globals);
        expect(resolvedView.rules).toEqual(globals.predicates.all);
    });
    it('should preserve resolved predicates and replace global predicate', ({ expect }) => {
        const globals = generateGlobals();
        const unresolvedView = {
            ...generateElementView(),
            rules: [{
                    exclude: [{ elementTag: 'obsolete', isEqual: true }],
                }, {
                    predicateId: 'all',
                }, {
                    include: [{
                            ref: {
                                model: 'new',
                            },
                        }],
                }],
        };
        const resolvedView = resolveGlobalRules(unresolvedView, globals);
        invariant(isElementView(resolvedView));
        expect(resolvedView.rules).toHaveLength(3);
        expect(resolvedView.rules[0]).toBeDefined();
        if (resolvedView.rules[0] === undefined)
            return;
        expect(isViewRulePredicate(resolvedView.rules[0])).toBeTruthy();
        if (!isViewRulePredicate(resolvedView.rules[0]))
            return;
        expect(resolvedView.rules[0].exclude).toEqual([{ elementTag: 'obsolete', isEqual: true }]);
        expect(resolvedView.rules[1]).toBeDefined();
        if (resolvedView.rules[1] === undefined)
            return;
        const expectedPredicateList = globals.predicates.all;
        expect(expectedPredicateList).toBeDefined();
        if (expectedPredicateList === undefined)
            return;
        expect(resolvedView.rules[1]).toEqual(expectedPredicateList[0]);
        expect(resolvedView.rules[2]).toBeDefined();
        if (resolvedView.rules[2] === undefined)
            return;
        expect(isViewRulePredicate(resolvedView.rules[2])).toBeTruthy();
        if (!isViewRulePredicate(resolvedView.rules[2]))
            return;
        expect(resolvedView.rules[2].include).toEqual([{
                ref: {
                    model: 'new',
                },
            }]);
    });
    it('should replace global predicate with all elements from the list', ({ expect }) => {
        const globals = generateGlobals();
        const unresolvedView = {
            ...generateElementView(),
            rules: [
                { exclude: [{ elementTag: 'obsolete', isEqual: true }] },
                { predicateId: 'multiple' },
                {
                    include: [{
                            ref: {
                                model: 'new',
                            },
                        }],
                },
            ],
        };
        const resolvedView = resolveGlobalRules(unresolvedView, globals);
        invariant(isElementView(resolvedView));
        const expectedPredicateList = globals.predicates.multiple;
        expect(expectedPredicateList).toBeDefined();
        if (expectedPredicateList === undefined)
            return;
        expect(resolvedView.rules).toHaveLength(2 + expectedPredicateList.length);
        expect(resolvedView.rules[0]).toBeDefined();
        if (resolvedView.rules[0] === undefined)
            return;
        expect(isViewRulePredicate(resolvedView.rules[0])).toBeTruthy();
        if (!isViewRulePredicate(resolvedView.rules[0]))
            return;
        expect(resolvedView.rules[0].exclude).toEqual([{ elementTag: 'obsolete', isEqual: true }]);
        for (let expI = 0; expI < 3; expI++) {
            expect(resolvedView.rules[expI + 1]).toBeDefined();
            if (resolvedView.rules[expI + 1] === undefined)
                return;
            expect(resolvedView.rules[expI + 1]).toEqual(expectedPredicateList[expI]);
        }
        expect(resolvedView.rules[4]).toBeDefined();
        if (resolvedView.rules[4] === undefined)
            return;
        expect(isViewRulePredicate(resolvedView.rules[4])).toBeTruthy();
        if (!isViewRulePredicate(resolvedView.rules[4]))
            return;
        expect(resolvedView.rules[4].include).toEqual([{
                ref: {
                    model: 'new',
                },
            }]);
    });
    it('should remove global predicate that does not exist', ({ expect }) => {
        const globals = generateGlobals();
        const unresolvedView = {
            ...generateElementView(),
            rules: [
                { exclude: [{ elementTag: 'obsolete', isEqual: true }] },
                { predicateId: 'missingPredicateId' },
                {
                    include: [{
                            ref: {
                                model: 'new',
                            },
                        }],
                },
            ],
        };
        const resolvedView = resolveGlobalRules(unresolvedView, globals);
        invariant(isElementView(resolvedView));
        expect(resolvedView.rules).toHaveLength(2);
        expect(resolvedView.rules[0]).toBeDefined();
        if (resolvedView.rules[0] === undefined)
            return;
        expect(isViewRulePredicate(resolvedView.rules[0])).toBeTruthy();
        if (!isViewRulePredicate(resolvedView.rules[0]))
            return;
        expect(resolvedView.rules[0].exclude).toEqual([{ elementTag: 'obsolete', isEqual: true }]);
        expect(resolvedView.rules[1]).toBeDefined();
        if (resolvedView.rules[1] === undefined)
            return;
        expect(isViewRulePredicate(resolvedView.rules[1])).toBeTruthy();
        if (!isViewRulePredicate(resolvedView.rules[1]))
            return;
        expect(resolvedView.rules[1].include).toEqual([{
                ref: {
                    model: 'new',
                },
            }]);
    });
    it('should preserve styles if no global styles used', ({ expect }) => {
        const globals = generateGlobals();
        const unresolvedView = {
            ...generateElementView(),
            rules: [{
                    targets: [{ wildcard: true }],
                    style: { color: 'green' },
                }],
        };
        const resolvedView = resolveGlobalRules(unresolvedView, globals);
        invariant(isElementView(resolvedView));
        expect(resolvedView.rules).toHaveLength(1);
        expect(resolvedView.rules[0]).toBeDefined();
        if (resolvedView.rules[0] === undefined)
            return;
        expect(isViewRuleStyle(resolvedView.rules[0])).toBeTruthy();
        if (!isViewRuleStyle(resolvedView.rules[0]))
            return;
        expect(resolvedView.rules[0].style).toEqual({ color: 'green' });
    });
    it('should replace global style id with a style', ({ expect }) => {
        const globals = generateGlobals();
        const unresolvedView = {
            ...generateElementView(),
            rules: [{
                    styleId: 'all',
                }],
        };
        const resolvedView = resolveGlobalRules(unresolvedView, globals);
        expect(resolvedView.rules).toEqual(globals.styles.all);
    });
    it('should preserve resolved styles and replace global style', ({ expect }) => {
        const globals = generateGlobals();
        const unresolvedView = {
            ...generateElementView(),
            rules: [{
                    targets: [{ wildcard: true }],
                    style: { color: 'secondary' },
                }, {
                    styleId: 'all',
                }, {
                    targets: [{ elementTag: 'new', isEqual: true }],
                    style: { color: 'green' },
                }],
        };
        const resolvedView = resolveGlobalRules(unresolvedView, globals);
        expect(resolvedView.rules).toHaveLength(3);
        expect(resolvedView.rules[0]).toBeDefined();
        if (resolvedView.rules[0] === undefined)
            return;
        expect(isViewRuleStyle(resolvedView.rules[0])).toBeTruthy();
        if (!isViewRuleStyle(resolvedView.rules[0]))
            return;
        expect(resolvedView.rules[0].style).toEqual({ color: 'secondary' });
        expect(resolvedView.rules[1]).toBeDefined();
        if (resolvedView.rules[1] === undefined)
            return;
        const expectedStyleList = globals.styles.all;
        expect(expectedStyleList).toBeDefined();
        if (expectedStyleList === undefined)
            return;
        expect(resolvedView.rules[1]).toEqual(expectedStyleList[0]);
        expect(resolvedView.rules[2]).toBeDefined();
        if (resolvedView.rules[2] === undefined)
            return;
        expect(isViewRuleStyle(resolvedView.rules[2])).toBeTruthy();
        if (!isViewRuleStyle(resolvedView.rules[2]))
            return;
        expect(resolvedView.rules[2].style).toEqual({ color: 'green' });
    });
    it('should replace global style with all elements from the list', ({ expect }) => {
        const globals = generateGlobals();
        const unresolvedView = {
            ...generateElementView(),
            rules: [{
                    targets: [{ wildcard: true }],
                    style: { color: 'secondary' },
                }, {
                    styleId: 'multiple',
                }, {
                    targets: [{ elementTag: 'new', isEqual: true }],
                    style: { color: 'green' },
                }],
        };
        const resolvedView = resolveGlobalRules(unresolvedView, globals);
        expect(resolvedView.rules).toHaveLength(4);
        expect(resolvedView.rules[0]).toBeDefined();
        if (resolvedView.rules[0] === undefined)
            return;
        expect(isViewRuleStyle(resolvedView.rules[0])).toBeTruthy();
        if (!isViewRuleStyle(resolvedView.rules[0]))
            return;
        expect(resolvedView.rules[0].style).toEqual({ color: 'secondary' });
        expect(resolvedView.rules[1]).toBeDefined();
        if (resolvedView.rules[1] === undefined)
            return;
        const expectedStyleList = globals.styles.multiple;
        expect(expectedStyleList).toBeDefined();
        if (expectedStyleList === undefined)
            return;
        expect(resolvedView.rules[1]).toEqual(expectedStyleList[0]);
        expect(resolvedView.rules[2]).toEqual(expectedStyleList[1]);
        expect(resolvedView.rules[3]).toBeDefined();
        if (resolvedView.rules[3] === undefined)
            return;
        expect(isViewRuleStyle(resolvedView.rules[3])).toBeTruthy();
        if (!isViewRuleStyle(resolvedView.rules[3]))
            return;
        expect(resolvedView.rules[3].style).toEqual({ color: 'green' });
    });
    it('should remove global style that does not exist', ({ expect }) => {
        const globals = generateGlobals();
        const unresolvedView = {
            ...generateElementView(),
            rules: [{
                    targets: [{ wildcard: true }],
                    style: { color: 'secondary' },
                }, {
                    styleId: 'missingStyleId',
                }, {
                    targets: [{ elementTag: 'new', isEqual: true }],
                    style: { color: 'green' },
                }],
        };
        const resolvedView = resolveGlobalRules(unresolvedView, globals);
        expect(resolvedView.rules).toHaveLength(2);
        expect(resolvedView.rules[0]).toBeDefined();
        if (resolvedView.rules[0] === undefined)
            return;
        expect(isViewRuleStyle(resolvedView.rules[0])).toBeTruthy();
        if (!isViewRuleStyle(resolvedView.rules[0]))
            return;
        expect(resolvedView.rules[0].style).toEqual({ color: 'secondary' });
        expect(resolvedView.rules[1]).toBeDefined();
        if (resolvedView.rules[1] === undefined)
            return;
        expect(isViewRuleStyle(resolvedView.rules[1])).toBeTruthy();
        if (!isViewRuleStyle(resolvedView.rules[1]))
            return;
        expect(resolvedView.rules[1].style).toEqual({ color: 'green' });
    });
    it('shold replace element, relation, and style predicates', ({ expect }) => {
        const globals = generateGlobals();
        const unresolvedView = {
            ...generateElementView(),
            rules: [
                { exclude: [{ elementTag: 'obsolete', isEqual: true }] },
                { predicateId: 'all' },
                {
                    include: [{
                            ref: {
                                model: 'new',
                            },
                        }],
                },
                { styleId: 'all' },
                { predicateId: 'relation' },
            ],
        };
        const resolvedView = resolveGlobalRules(unresolvedView, globals);
        invariant(isElementView(resolvedView));
        const expectedPredicateList = globals.predicates;
        expect(resolvedView.rules).toHaveLength(5);
        expect(resolvedView.rules[0]).toBeDefined();
        if (resolvedView.rules[0] === undefined)
            return;
        expect(isViewRulePredicate(resolvedView.rules[0])).toBeTruthy();
        if (!isViewRulePredicate(resolvedView.rules[0]))
            return;
        expect(resolvedView.rules[0].exclude).toEqual([{ elementTag: 'obsolete', isEqual: true }]);
        expect(resolvedView.rules[1]).toBeDefined();
        if (resolvedView.rules[1] === undefined)
            return;
        const expectedPredicate = expectedPredicateList.all;
        expect(expectedPredicate).toBeDefined();
        if (expectedPredicate === undefined)
            return;
        expect(resolvedView.rules[1]).toEqual(expectedPredicate[0]);
        expect(resolvedView.rules[2]).toBeDefined();
        if (resolvedView.rules[2] === undefined)
            return;
        expect(isViewRulePredicate(resolvedView.rules[2])).toBeTruthy();
        if (!isViewRulePredicate(resolvedView.rules[2]))
            return;
        expect(resolvedView.rules[2].include).toEqual([{
                ref: {
                    model: 'new',
                },
            }]);
        expect(resolvedView.rules[3]).toBeDefined();
        if (resolvedView.rules[3] === undefined)
            return;
        const expectedStyleList = globals.styles.all;
        expect(expectedStyleList).toBeDefined();
        if (expectedStyleList === undefined)
            return;
        expect(resolvedView.rules[3]).toEqual(expectedStyleList[0]);
        expect(resolvedView.rules[4]).toBeDefined();
        if (resolvedView.rules[4] === undefined)
            return;
        const expectedRelationPredicate = expectedPredicateList.relation;
        expect(expectedRelationPredicate).toBeDefined();
        if (expectedRelationPredicate === undefined)
            return;
        expect(resolvedView.rules[4]).toEqual(expectedRelationPredicate[0]);
    });
    it('should preserve rules if global rules list is empty', ({ expect }) => {
        const globals = emptyGlobals();
        const unresolvedView = {
            ...generateElementView(),
            rules: [{
                    targets: [{ wildcard: true }],
                    style: { color: 'secondary' },
                }, {
                    targets: [{ elementTag: 'new', isEqual: true }],
                    style: { color: 'green' },
                }, {
                    include: [{
                            ref: {
                                model: 'new',
                            },
                        }],
                }, {
                    exclude: [{ elementTag: 'obsolete', isEqual: true }],
                }],
        };
        const resolvedView = resolveGlobalRules(unresolvedView, globals);
        invariant(isElementView(resolvedView));
        expect(resolvedView.rules).toHaveLength(4);
        expect(resolvedView.rules[0]).toBeDefined();
        if (resolvedView.rules[0] === undefined)
            return;
        expect(isViewRuleStyle(resolvedView.rules[0])).toBeTruthy();
        if (!isViewRuleStyle(resolvedView.rules[0]))
            return;
        expect(resolvedView.rules[0].style).toEqual({ color: 'secondary' });
        expect(resolvedView.rules[1]).toBeDefined();
        if (resolvedView.rules[1] === undefined)
            return;
        expect(isViewRuleStyle(resolvedView.rules[1])).toBeTruthy();
        if (!isViewRuleStyle(resolvedView.rules[1]))
            return;
        expect(resolvedView.rules[1].style).toEqual({ color: 'green' });
        expect(resolvedView.rules[2]).toBeDefined();
        if (resolvedView.rules[2] === undefined)
            return;
        expect(isViewRulePredicate(resolvedView.rules[2])).toBeTruthy();
        if (!isViewRulePredicate(resolvedView.rules[2]))
            return;
        expect(resolvedView.rules[2].include).toEqual([{
                ref: {
                    model: 'new',
                },
            }]);
        expect(resolvedView.rules[3]).toBeDefined();
        if (resolvedView.rules[3] === undefined)
            return;
        expect(isViewRulePredicate(resolvedView.rules[3])).toBeTruthy();
        if (!isViewRulePredicate(resolvedView.rules[3]))
            return;
        expect(resolvedView.rules[3].exclude).toEqual([{ elementTag: 'obsolete', isEqual: true }]);
    });
});
