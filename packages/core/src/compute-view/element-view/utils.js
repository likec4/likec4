import { filter, hasAtLeast, only } from 'remeda';
import { exact, } from '../../types';
import { invariant } from '../../utils';
import { buildComputedNodes, elementModelToNodeSource } from '../utils/buildComputedNodes';
import { mergePropsFromRelationships } from '../utils/merge-props-from-relationships';
export const NoWhere = () => true;
export const NoFilter = (x) => x;
export function toComputedEdges(connections) {
    return connections.reduce((acc, e) => {
        // const modelRelations = []
        // const deploymentRelations = []
        const relations = [
            ...e.relations,
        ];
        invariant(hasAtLeast(relations, 1), 'Edge must have at least one relation');
        const $defaults = e.source.$model.$styles.defaults;
        const source = e.source.id;
        const target = e.target.id;
        const { title, color = $defaults.relationship.color, line = $defaults.relationship.line, head = $defaults.relationship.arrow, ...props } = mergePropsFromRelationships(relations.map(r => r.$relationship), 
        // Prefer only single relationship
        // https://github.com/likec4/likec4/issues/1423
        only(filter(relations, r => r.source.id === source && r.target.id === target))?.$relationship);
        const edge = exact({
            id: e.id,
            parent: e.boundary?.id ?? null,
            source: source,
            target: target,
            label: title ?? null,
            relations: relations.map((r) => r.id),
            color,
            line,
            head,
            ...props,
        });
        acc.push(edge);
        return acc;
    }, []);
}
export function buildNodes(model, memory) {
    return buildComputedNodes(model.$styles, [...memory.final].map(elementModelToNodeSource), memory.groups);
}
