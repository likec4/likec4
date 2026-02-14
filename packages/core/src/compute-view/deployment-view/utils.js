import { anyPass, hasAtLeast, isEmpty, omit } from 'remeda';
import { deploymentConnection } from '../../model';
import { exact, FqnExpr, isViewRuleStyle, preferSummary } from '../../types';
import { invariant, nonexhaustive, parentFqn } from '../../utils';
import { applyViewRuleStyle } from '../utils/applyViewRuleStyles';
import { buildComputedNodes } from '../utils/buildComputedNodes';
import { mergePropsFromRelationships } from '../utils/merge-props-from-relationships';
export const { findConnection, findConnectionsBetween, findConnectionsWithin } = deploymentConnection;
export function resolveElements(model, expr) {
    const ref = model.element(expr.ref.deployment);
    if (ref.isDeploymentNode()) {
        if (expr.selector === 'children') {
            return [...ref.children()];
        }
        if (expr.selector === 'expanded') {
            return [ref, ...ref.children()];
        }
        if (expr.selector === 'descendants') {
            return [...ref.descendants()];
        }
    }
    return [ref];
}
export function resolveModelElements(model, expr) {
    const ref = model.$model.element(expr.ref.model);
    if (expr.selector === 'children') {
        return [...ref.children()];
    }
    if (expr.selector === 'expanded') {
        return [ref, ...ref.children()];
    }
    if (expr.selector === 'descendants') {
        return [...ref.descendants()];
    }
    return [ref];
}
export function deploymentExpressionToPredicate(target) {
    if (FqnExpr.isWildcard(target)) {
        return () => true;
    }
    if (FqnExpr.isElementTagExpr(target) || FqnExpr.isElementKindExpr(target)) {
        throw new Error('element kind and tag expressions are not supported in deployment view rules');
    }
    if (FqnExpr.isDeploymentRef(target)) {
        const fqn = target.ref.deployment;
        if (target.selector === 'expanded') {
            const fqnWithDot = fqn + '.';
            return n => n.id === fqn || n.id.startsWith(fqnWithDot);
        }
        if (target.selector === 'descendants') {
            const fqnWithDot = fqn + '.';
            return n => n.id.startsWith(fqnWithDot);
        }
        if (target.selector === 'children') {
            return n => parentFqn(n.id) === fqn;
        }
        return n => n.id === fqn;
    }
    if (FqnExpr.isModelRef(target)) {
        const fqn = target.ref.model;
        if (target.selector === 'expanded') {
            const fqnWithDot = fqn + '.';
            return (n) => {
                const m = n.modelRef ?? null;
                if (!m) {
                    return true;
                }
                return m === fqn || m.startsWith(fqnWithDot);
            };
        }
        if (target.selector === 'descendants') {
            const fqnWithDot = fqn + '.';
            return (n) => {
                const m = n.modelRef ?? null;
                if (!m) {
                    return true;
                }
                return m.startsWith(fqnWithDot);
            };
        }
        if (target.selector === 'children') {
            return (n) => {
                const m = n.modelRef ?? null;
                if (!m) {
                    return true;
                }
                return parentFqn(m) === fqn;
            };
        }
        return (n) => {
            const m = n.modelRef ?? null;
            if (!m) {
                return true;
            }
            return m === fqn;
        };
    }
    nonexhaustive(target);
}
function instanceSummary(model) {
    return preferSummary(model.$instance) ?? preferSummary(model.element.$element);
}
function deploymentNodeToNodeSource(el) {
    const id = el.id;
    const onlyOneInstance = el.onlyOneInstance();
    return exact({
        id: id,
        deploymentRef: id,
        title: el.title,
        kind: el.kind,
        technology: el.technology ?? undefined,
        links: hasAtLeast(el.links, 1) ? [...el.links] : undefined,
        notation: el.$node.notation ?? undefined,
        color: el.color,
        shape: el.shape,
        modelRef: onlyOneInstance?.element.id,
        icon: el.style.icon,
        description: preferSummary(el.$node) ?? undefined,
        tags: [...el.tags],
        style: omit(el.style, ['icon', 'shape', 'color']),
    });
}
function instanceToNodeSource(el) {
    const instance = el.$instance;
    const element = el.element;
    const { icon, color, shape, ...style } = el.style;
    // Merge links from element and instance
    const links = [
        ...element.links,
        ...(instance.links ?? []),
    ];
    return exact({
        id: el.id,
        kind: 'instance',
        title: el.title,
        description: instanceSummary(el) ?? undefined,
        technology: el.technology ?? undefined,
        tags: [...el.tags],
        links: hasAtLeast(links, 1) ? links : undefined,
        icon,
        color,
        shape,
        style,
        deploymentRef: instance.id,
        modelRef: element.id,
        notation: instance.notation,
    });
}
function toNodeSource(el) {
    if (el.isInstance()) {
        return instanceToNodeSource(el);
    }
    return deploymentNodeToNodeSource(el);
}
export function toComputedEdges(connections) {
    return connections.reduce((acc, e) => {
        // const modelRelations = []
        // const deploymentRelations = []
        const relations = [
            ...e.relations.model,
            ...e.relations.deployment,
        ];
        invariant(hasAtLeast(relations, 1), 'Edge must have at least one relation');
        const defaults = e.source.$model.$styles.defaults;
        const source = e.source.id;
        const target = e.target.id;
        const { title, color = defaults.relationship.color, line = defaults.relationship.line, head = defaults.relationship.arrow, ...props } = mergePropsFromRelationships(relations.map(r => r.$relationship)); // || relations.find(r => r.source === source && r.target === target)
        const edge = exact({
            id: e.id,
            parent: e.boundary?.id ?? null,
            source,
            target,
            label: title ?? null,
            relations: relations.map((r) => r.id),
            color,
            line,
            head,
            ...props,
        });
        // If exists same edge but in opposite direction
        const existing = acc.find(e => e.source === target && e.target === source);
        if (existing && edge.label === existing.label) {
            existing.dir = 'both';
            const head = existing.head ?? edge.head ?? e.source.$model.$styles.defaults.relationship.arrow;
            existing.head ??= head;
            existing.tail ??= head;
            if (edge.color) {
                existing.color ??= edge.color;
            }
            if (edge.line) {
                existing.line ??= edge.line;
            }
            return acc;
        }
        acc.push(edge);
        return acc;
    }, []);
}
export function buildNodes(model, memory) {
    const nodesMap = buildComputedNodes(model.$styles, [...memory.final].map(toNodeSource));
    // For each node, check if
    // - it is a leaf node (no children)
    // - it has a deploymentRef and modelRef
    // - it is a deployment node
    // - it has only one instance
    // If all conditions are met, inherit properties from the instance if they are not set in the deployment node
    for (const node of nodesMap.values()) {
        if (!node.deploymentRef || !node.modelRef || node.children.length > 0) {
            continue;
        }
        // Find deployment element and check if it has only one instance
        const deploymentNode = model.deployment.element(node.deploymentRef);
        const onlyOneInstance = deploymentNode.isDeploymentNode() && deploymentNode.onlyOneInstance();
        if (!onlyOneInstance) {
            continue;
        }
        // Inherit properties from the logical model if it is a deployment node with only one instance
        // If title was not overriden (i.e. it matches the name), take title from the instance
        if (node.title === deploymentNode.name) {
            node.title = onlyOneInstance.title;
        }
        // If description/tech not set, take from instance
        node.description ??= instanceSummary(onlyOneInstance) ?? null;
        node.technology ??= onlyOneInstance.technology;
        // If tags/links are missing, take from instance
        if (isEmpty(node.tags)) {
            node.tags = [...onlyOneInstance.tags];
        }
        if ((!node.links || isEmpty(node.links)) && hasAtLeast(onlyOneInstance.links, 1)) {
            node.links = [...onlyOneInstance.links];
        }
        // Apply styles from instance if not set or set to defaults
        const defaults = model.$styles.defaults;
        if (node.shape === defaults.shape && node.shape !== onlyOneInstance.shape) {
            node.shape = onlyOneInstance.shape;
            // reset notation when shape is changed
            node.notation = null;
        }
        if (node.color === defaults.color && node.color !== onlyOneInstance.color) {
            node.color = onlyOneInstance.color;
            // reset notation when color is changed
            node.notation = null;
        }
        if (!node.icon && onlyOneInstance.icon) {
            node.icon = onlyOneInstance.icon;
        }
    }
    return nodesMap;
}
export function applyDeploymentViewRuleStyles(rules, nodes) {
    for (const rule of rules) {
        if (!isViewRuleStyle(rule) || rule.targets.length === 0) {
            continue;
        }
        const predicates = rule.targets.map(deploymentExpressionToPredicate);
        applyViewRuleStyle(rule, anyPass(predicates), nodes);
    }
    return nodes;
}
