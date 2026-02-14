import { findLast, map } from 'remeda';
import { _stage, _type, isViewRuleAutoLayout, isViewRulePredicate, } from '../../types';
import { buildElementNotations } from '../utils/buildElementNotations';
import { linkNodesWithEdges } from '../utils/link-nodes-with-edges';
import { topologicalSort } from '../utils/topological-sort';
import { calcViewLayoutHash } from '../utils/view-hash';
import { Memory } from './memory';
import { predicateToPatch } from './predicates';
import { StageFinal } from './stages/stage-final';
import { applyDeploymentViewRuleStyles, buildNodes, toComputedEdges } from './utils';
export function processPredicates(model, rules) {
    let memory = Memory.empty();
    for (const rule of rules) {
        if (isViewRulePredicate(rule)) {
            const op = 'include' in rule ? 'include' : 'exclude';
            const exprs = rule.include ?? rule.exclude;
            for (const expr of exprs) {
                let stage = op === 'include' ? memory.stageInclude(expr) : memory.stageExclude(expr);
                const ctx = { expr, model, stage, memory, where: null };
                stage = predicateToPatch(op, ctx) ?? stage;
                memory = stage.commit();
            }
        }
    }
    return StageFinal.for(memory).commit();
}
export function computeDeploymentView(likec4model, { docUri: _docUri, // exclude docUri
rules, // exclude rules
...view }) {
    const memory = processPredicates(likec4model.deployment, rules);
    const nodesMap = buildNodes(likec4model, memory);
    const computedEdges = toComputedEdges(memory.connections);
    linkNodesWithEdges(nodesMap, computedEdges);
    const sorted = topologicalSort({
        nodes: nodesMap,
        edges: computedEdges,
    });
    const nodes = applyDeploymentViewRuleStyles(rules, sorted.nodes);
    const autoLayoutRule = findLast(rules, isViewRuleAutoLayout);
    const elementNotations = buildElementNotations(nodes);
    return calcViewLayoutHash({
        ...view,
        [_stage]: 'computed',
        [_type]: 'deployment',
        autoLayout: {
            direction: autoLayoutRule?.direction ?? 'TB',
            ...(autoLayoutRule?.nodeSep && { nodeSep: autoLayoutRule.nodeSep }),
            ...(autoLayoutRule?.rankSep && { rankSep: autoLayoutRule.rankSep }),
        },
        edges: sorted.edges,
        nodes: map(nodes, n => {
            if (n.icon === 'none') {
                delete n.icon;
            }
            return n;
        }),
        ...(elementNotations.length > 0 && {
            notation: {
                nodes: elementNotations,
            },
        }),
    });
}
