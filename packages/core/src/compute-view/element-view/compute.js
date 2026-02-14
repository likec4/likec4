import { anyPass, filter, findLast, forEach, hasAtLeast, map, pipe } from 'remeda';
import { ConnectionModel } from '../../model/connection/model/ConnectionModel';
import { isViewRuleAutoLayout, isViewRuleGroup, isViewRulePredicate, isViewRuleRank, ModelExpression, ModelFqnExpr, ModelRelationExpr, whereOperatorAsPredicate, } from '../../types';
import { invariant, nonexhaustive, nonNullable, sortParentsFirst } from '../../utils';
import { DefaultMap } from '../../utils/mnemonist';
import { applyCustomElementProperties } from '../utils/applyCustomElementProperties';
import { applyCustomRelationProperties } from '../utils/applyCustomRelationProperties';
import { applyViewRuleStyles } from '../utils/applyViewRuleStyles';
import { buildElementNotations } from '../utils/buildElementNotations';
import { elementExprToPredicate } from '../utils/elementExpressionToPredicate';
import { linkNodesWithEdges } from '../utils/link-nodes-with-edges';
import { resolveGlobalRulesInElementView } from '../utils/resolve-global-rules';
import { topologicalSort } from '../utils/topological-sort';
import { calcViewLayoutHash } from '../utils/view-hash';
import { Memory } from './memory';
import { ActiveGroupMemory } from './memory/memory';
import { StageFinal } from './memory/stage-final';
import { ExpandedElementPredicate } from './predicates/element-expand';
import { ElementKindOrTagPredicate } from './predicates/element-kind-tag';
import { ElementRefPredicate } from './predicates/element-ref';
import { DirectRelationExprPredicate } from './predicates/relation-direct';
import { IncomingExprPredicate } from './predicates/relation-in';
import { InOutRelationPredicate } from './predicates/relation-in-out';
import { OutgoingExprPredicate } from './predicates/relation-out';
import { WildcardPredicate } from './predicates/wildcard';
import { buildNodes, NoFilter, NoWhere, toComputedEdges } from './utils';
function processElementPredicate(expr, op, ctx) {
    switch (true) {
        case ModelFqnExpr.isCustom(expr): {
            if (op === 'include') {
                return processElementPredicate(expr.custom.expr, op, ctx);
            }
            return ctx.stage;
        }
        case ModelFqnExpr.isWhere(expr): {
            const where = whereOperatorAsPredicate(expr.where.condition);
            const filterWhere = (elements) => {
                return filter(elements, where);
            };
            return processElementPredicate(expr.where.expr, op, { ...ctx, where, filterWhere });
        }
        case ModelFqnExpr.isModelRef(expr) && expr.selector === 'expanded': {
            return ExpandedElementPredicate[op]({ ...ctx, expr }) ?? ctx.stage;
        }
        case ModelFqnExpr.isWildcard(expr): {
            return WildcardPredicate[op]({ ...ctx, expr }) ?? ctx.stage;
        }
        case ModelFqnExpr.isElementKindExpr(expr):
        case ModelFqnExpr.isElementTagExpr(expr): {
            return ElementKindOrTagPredicate[op]({ ...ctx, expr }) ?? ctx.stage;
        }
        case ModelFqnExpr.isModelRef(expr): {
            return ElementRefPredicate[op]({ ...ctx, expr }) ?? ctx.stage;
        }
        default:
            nonexhaustive(expr);
    }
}
function processRelationtPredicate(expr, op, ctx) {
    switch (true) {
        case ModelRelationExpr.isCustom(expr): {
            if (op === 'include') {
                return processRelationtPredicate(expr.customRelation.expr, op, ctx);
            }
            return ctx.stage;
        }
        case ModelRelationExpr.isWhere(expr): {
            const where = whereOperatorAsPredicate(expr.where.condition);
            const filterRelations = (relations) => {
                return new Set(filter([...relations], where));
            };
            const filterWhere = (connections) => {
                return pipe(connections, map(c => new ConnectionModel(c.source, c.target, filterRelations(c.relations))), filter(c => c.nonEmpty()));
            };
            return processRelationtPredicate(expr.where.expr, op, {
                ...ctx,
                where,
                filterWhere,
            });
        }
        case ModelRelationExpr.isInOut(expr): {
            return InOutRelationPredicate[op]({ ...ctx, expr }) ?? ctx.stage;
        }
        case ModelRelationExpr.isDirect(expr): {
            return DirectRelationExprPredicate[op]({ ...ctx, expr }) ?? ctx.stage;
        }
        case ModelRelationExpr.isOutgoing(expr): {
            return OutgoingExprPredicate[op]({ ...ctx, expr }) ?? ctx.stage;
        }
        case ModelRelationExpr.isIncoming(expr): {
            return IncomingExprPredicate[op]({ ...ctx, expr }) ?? ctx.stage;
        }
        default:
            nonexhaustive(expr);
    }
}
/**
 * Iterates over the rules and applies them to the memory.
 * If the rule is a group, it recursively processes the group rules.
 */
function process_predicates(model, memory, rules) {
    const ctx = {
        model,
        scope: memory.scope,
        where: NoWhere,
        filterWhere: NoFilter,
    };
    for (const rule of rules) {
        if (isViewRuleGroup(rule)) {
            const groupMemory = ActiveGroupMemory.enter(memory, rule);
            memory = process_predicates(model, groupMemory, rule.groupRules);
            invariant(memory instanceof ActiveGroupMemory, 'processPredicates must return ActiveGroupMemory');
            memory = memory.leave();
            continue;
        }
        if (isViewRulePredicate(rule)) {
            const op = 'include' in rule ? 'include' : 'exclude';
            const exprs = rule.include ?? rule.exclude;
            for (const expr of exprs) {
                let stage = op === 'include' ? memory.stageInclude(expr) : memory.stageExclude(expr);
                switch (true) {
                    case ModelExpression.isFqnExpr(expr):
                        stage = processElementPredicate(expr, op, {
                            ...ctx,
                            stage,
                            memory,
                        }) ?? stage;
                        break;
                    case ModelExpression.isRelationExpr(expr):
                        stage = processRelationtPredicate(expr, op, {
                            ...ctx,
                            stage,
                            memory,
                        }) ?? stage;
                        break;
                    default:
                        nonexhaustive(expr);
                }
                memory = stage.commit();
            }
        }
    }
    return memory;
}
export function processPredicates(model, memory, rules) {
    memory = process_predicates(model, memory, rules);
    return StageFinal.for(memory).commit();
}
export function computeElementView(likec4model, { docUri: _docUri, // exclude docUri
rules: _rules, // exclude rules
...view }) {
    const rules = resolveGlobalRulesInElementView(_rules, likec4model.globals);
    const scope = view.viewOf ? likec4model.asComputed.element(view.viewOf) : null;
    let memory = processPredicates(likec4model, Memory.empty(scope), rules);
    if (memory.isEmpty() && scope) {
        memory = memory.update({
            final: new Set([scope]),
        });
    }
    memory = assignElementsToGroups(memory);
    const nodesMap = buildNodes(likec4model, memory);
    const computedEdges = toComputedEdges(memory.connections);
    linkNodesWithEdges(nodesMap, computedEdges);
    const sorted = topologicalSort({
        nodes: nodesMap,
        edges: computedEdges,
    });
    const nodes = applyCustomElementProperties(rules, applyViewRuleStyles(rules, sorted.nodes));
    const autoLayoutRule = findLast(rules, isViewRuleAutoLayout);
    const nodeNotations = buildElementNotations(nodes);
    const ranks = collectRankConstraints(rules, nodes);
    return calcViewLayoutHash({
        ...view,
        _stage: 'computed',
        autoLayout: {
            direction: autoLayoutRule?.direction ?? 'TB',
            ...(autoLayoutRule?.nodeSep && { nodeSep: autoLayoutRule.nodeSep }),
            ...(autoLayoutRule?.rankSep && { rankSep: autoLayoutRule.rankSep }),
        },
        edges: applyCustomRelationProperties(rules, nodes, sorted.edges),
        nodes: map(nodes, n => {
            if (n.icon === 'none') {
                delete n.icon;
            }
            return n;
        }),
        ...(nodeNotations.length > 0 && {
            notation: {
                nodes: nodeNotations,
            },
        }),
        ...(ranks.length > 0 && { ranks }),
    });
}
function collectRankConstraints(rules, nodes) {
    const constraints = [];
    for (const rule of rules) {
        if (!isViewRuleRank(rule) || rule.targets.length === 0) {
            continue;
        }
        const isTargeted = anyPass(rule.targets.map(elementExprToPredicate));
        const nodesInRank = pipe(nodes, filter(isTargeted), map(n => n.id));
        if (!hasAtLeast(nodesInRank, 1)) { // rank value sink, source, min, max can admit one node
            continue;
        }
        constraints.push({
            type: rule.rank,
            nodes: nodesInRank,
        });
    }
    return constraints;
}
/**
 * Clean up group.explicits and group.implicits
 */
function assignElementsToGroups(memory) {
    if (memory.groups.length === 0) {
        return memory;
    }
    const groupAssignments = new DefaultMap(() => new Set());
    const assignedTo = new Map();
    const isAncestorAssigned = (el) => {
        for (const parent of el.ancestors()) {
            const groupId = assignedTo.get(parent);
            if (groupId) {
                assignedTo.set(el, groupId);
                groupAssignments.get(groupId).add(el);
                return true;
            }
        }
        return false;
    };
    const isDescendantAssigned = (el) => {
        for (const descendant of el.descendants('asc')) {
            const groupId = assignedTo.get(descendant);
            if (groupId) {
                assignedTo.set(el, groupId);
                groupAssignments.get(groupId).add(el);
                return true;
            }
        }
        return false;
    };
    pipe(sortParentsFirst([...memory.explicitFirstSeenIn.keys()]), forEach((el) => {
        if (!isAncestorAssigned(el)) {
            const groupId = nonNullable(memory.explicitFirstSeenIn.get(el));
            assignedTo.set(el, groupId);
            groupAssignments.get(groupId).add(el);
        }
    }));
    pipe(sortParentsFirst([...memory.lastSeenIn.keys()]), filter(el => !assignedTo.has(el)), forEach((el) => {
        if (isAncestorAssigned(el)) {
            return;
        }
        if (isDescendantAssigned(el)) {
            return;
        }
        const groupId = nonNullable(memory.lastSeenIn.get(el));
        assignedTo.set(el, groupId);
        groupAssignments.get(groupId).add(el);
    }));
    if (groupAssignments.size === 0) {
        return memory;
    }
    let groups = memory.groups.map(group => {
        const explicits = groupAssignments.get(group.id);
        if (!explicits) {
            return group;
        }
        return group.update(explicits);
    });
    return memory.update({ groups });
}
