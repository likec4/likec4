import { findLast, isTruthy, map, pipe } from 'remeda';
import { _stage, _type, exact, isDynamicStepsParallel, isDynamicStepsSeries, isViewRuleAutoLayout, stepEdgeId, } from '../../types';
import { intersection, invariant, nonNullable, toArray, union } from '../../utils';
import { ancestorsFqn, commonAncestor, isAncestor, parentFqn, sortParentsFirst } from '../../utils/fqn';
import { applyCustomElementProperties } from '../utils/applyCustomElementProperties';
import { applyViewRuleStyles } from '../utils/applyViewRuleStyles';
import { buildComputedNodes, elementModelToNodeSource } from '../utils/buildComputedNodes';
import { buildElementNotations } from '../utils/buildElementNotations';
import { resolveGlobalRulesInDynamicView } from '../utils/resolve-global-rules';
import { calcViewLayoutHash } from '../utils/view-hash';
import { elementsFromIncludeProperties, elementsFromSteps, findRelations } from './utils';
class DynamicViewCompute {
    model;
    view;
    // Intermediate state
    steps = [];
    constructor(model, view) {
        this.model = model;
        this.view = view;
    }
    compute() {
        const { docUri: _docUri, // exclude docUri
        rules: _rules, // exclude rules
        steps: viewSteps, ...view } = this.view;
        const rules = resolveGlobalRulesInDynamicView(_rules, this.model.globals);
        // Identify actors
        const explicits = elementsFromIncludeProperties(this.model, rules);
        const fromSteps = elementsFromSteps(this.model, viewSteps);
        const actors = pipe(union(
        // First all actors, that are explicitly included
        intersection(explicits, fromSteps), 
        // Then all actors from steps
        fromSteps, 
        // Then all explicits (not from steps)
        explicits), toArray(), sortParentsFirst);
        // Identify compounds
        const compounds = actors.reduce((acc, actor, index, all) => {
            for (let i = index + 1; i < all.length; i++) {
                const other = all[i];
                if (isAncestor(actor, other)) {
                    acc.push(actor);
                    break;
                }
            }
            return acc;
        }, []);
        // Process steps
        const processStep = (step, stepNum, prefix) => {
            if (isDynamicStepsSeries(step)) {
                for (const s of step.__series) {
                    stepNum = processStep(s, stepNum, prefix);
                }
                return stepNum;
            }
            const id = prefix ? stepEdgeId(prefix, stepNum) : stepEdgeId(stepNum);
            const { source: stepSource, target: stepTarget, title: stepTitle, isBackward: _isBackward, // omit
            navigateTo: stepNavigateTo, notation: _notation, // omit
            ...rest } = step;
            const source = this.model.element(stepSource);
            const sourceColumn = actors.indexOf(source);
            invariant(sourceColumn >= 0, `Source ${stepSource} not found`);
            const target = this.model.element(stepTarget);
            const targetColumn = actors.indexOf(target);
            invariant(targetColumn >= 0, `Target ${stepTarget} not found`);
            if (compounds.includes(source) || compounds.includes(target)) {
                console.error(`Step ${source.id} -> ${target.id} because it involves a compound`);
                // return stepNum
            }
            const { title, relations, navigateTo: derivedNavigateTo, ...derived } = findRelations(source, target, this.view.id);
            const navigateTo = isTruthy(stepNavigateTo) && stepNavigateTo !== this.view.id
                ? stepNavigateTo
                : derivedNavigateTo;
            // If step has kind but no technology, use technology from specification
            const kindTechnology = step.kind && !step.technology
                ? this.model.specification.relationships[step.kind]?.technology
                : undefined;
            this.steps.push(exact({
                ...derived,
                ...rest,
                ...(kindTechnology && { technology: kindTechnology }),
                id,
                source,
                target,
                navigateTo,
                title: stepTitle ?? title,
                relations: relations ?? [],
                isBackward: sourceColumn > targetColumn,
            }));
            return stepNum + 1;
        };
        let stepNum = 1;
        for (const step of viewSteps) {
            if (isDynamicStepsParallel(step)) {
                let nestedStepNum = 1;
                for (const s of step.__parallel) {
                    nestedStepNum = processStep(s, nestedStepNum, stepNum);
                }
                // Increment stepNum after processing all parallel steps
                stepNum++;
                continue;
            }
            stepNum = processStep(step, stepNum);
        }
        const nodesMap = buildComputedNodes(this.model.$styles, actors.map(elementModelToNodeSource));
        const defaults = this.model.$styles.defaults.relationship;
        const edges = this.steps.map(({ id, source, target, relations, title, isBackward, tags, ...step }) => {
            const sourceNode = nonNullable(nodesMap.get(source.id), `Source node ${source.id} not found`);
            const targetNode = nonNullable(nodesMap.get(target.id), `Target node ${target.id} not found`);
            const edge = {
                id: id,
                parent: commonAncestor(source.id, target.id),
                source: sourceNode.id,
                target: targetNode.id,
                label: title ?? null,
                relations,
                color: defaults.color,
                line: defaults.line,
                head: defaults.arrow,
                tags: tags ?? [],
                ...step,
            };
            if (isBackward) {
                edge.dir = 'back';
            }
            while (edge.parent && !nodesMap.has(edge.parent)) {
                edge.parent = parentFqn(edge.parent);
            }
            sourceNode.outEdges.push(edge.id);
            targetNode.inEdges.push(edge.id);
            // Process edge source ancestors
            for (const sourceAncestor of ancestorsFqn(edge.source)) {
                if (sourceAncestor === edge.parent) {
                    break;
                }
                nodesMap.get(sourceAncestor)?.outEdges.push(edge.id);
            }
            // Process target hierarchy
            for (const targetAncestor of ancestorsFqn(edge.target)) {
                if (targetAncestor === edge.parent) {
                    break;
                }
                nodesMap.get(targetAncestor)?.inEdges.push(edge.id);
            }
            return edge;
        });
        const nodes = applyCustomElementProperties(rules, applyViewRuleStyles(rules, 
        // Keep order of elements
        actors.map(e => nonNullable(nodesMap.get(e.id)))));
        const autoLayoutRule = findLast(rules, isViewRuleAutoLayout);
        const nodeNotations = buildElementNotations(nodes);
        return calcViewLayoutHash({
            ...view,
            [_type]: 'dynamic',
            [_stage]: 'computed',
            variant: view.variant ?? 'diagram',
            autoLayout: {
                direction: autoLayoutRule?.direction ?? 'LR',
                ...(autoLayoutRule?.nodeSep && { nodeSep: autoLayoutRule.nodeSep }),
                ...(autoLayoutRule?.rankSep && { rankSep: autoLayoutRule.rankSep }),
            },
            nodes: map(nodes, n => {
                if (n.icon === 'none') {
                    delete n.icon;
                }
                return n;
            }),
            edges,
            ...(nodeNotations.length > 0 && {
                notation: {
                    nodes: nodeNotations,
                },
            }),
        });
    }
}
export function computeDynamicView(model, view) {
    return new DynamicViewCompute(model, view).compute();
}
