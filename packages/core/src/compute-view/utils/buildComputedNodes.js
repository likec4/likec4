import { omit } from 'remeda';
import { exact, GroupElementKind, preferSummary, } from '../../types';
import { nonNullable } from '../../utils';
import { compareByFqnHierarchically, parentFqn } from '../../utils/fqn';
function updateDepthOfAncestors(node, nodes) {
    let parentNd;
    while (!!node.parent && (parentNd = nodes.get(node.parent))) {
        const depth = parentNd.depth ?? 1;
        parentNd.depth = Math.max(depth, (node.depth ?? 0) + 1);
        if (parentNd.depth === depth) {
            // stop if we didn't change depth
            break;
        }
        node = parentNd;
    }
}
export function elementModelToNodeSource(el) {
    const { id, title, ...rest } = omit(el.$element, ['summary', 'description', 'metadata', 'style', 'tags']);
    const { color, icon, shape, ...style } = el.style;
    return exact({
        id: id,
        title,
        modelRef: id,
        shape,
        color,
        icon,
        style,
        description: preferSummary(el.$element),
        tags: [...el.tags],
        ...rest,
    });
}
export function buildComputedNodes({ defaults }, elements, groups) {
    const nodesMap = new Map();
    const elementToGroup = new Map();
    groups?.forEach(({ id, parent, viewRule, elements }) => {
        if (parent) {
            nonNullable(nodesMap.get(parent), `Parent group node ${parent} not found`).children.push(id);
        }
        nodesMap.set(id, {
            id,
            parent,
            kind: GroupElementKind,
            title: viewRule.title ?? '',
            color: viewRule.color ?? defaults.group.color ?? defaults.color,
            shape: 'rectangle',
            children: [],
            inEdges: [],
            outEdges: [],
            level: 0,
            depth: 0,
            tags: [],
            style: exact({
                border: viewRule.border ?? defaults.group.border,
                opacity: viewRule.opacity ?? defaults.group.opacity,
                size: viewRule.size,
                multiple: viewRule.multiple,
                padding: viewRule.padding,
                textSize: viewRule.textSize,
            }),
        });
        for (const e of elements) {
            elementToGroup.set(e.id, id);
        }
    });
    // Ensure that parent nodes are created before child nodes
    Array.from(elements)
        .sort(compareByFqnHierarchically)
        .forEach(({ id, ...el }) => {
        let parent = parentFqn(id);
        let level = 0;
        let parentNd;
        // Find the first ancestor that is already in the map
        while (parent) {
            parentNd = nodesMap.get(parent);
            if (parentNd) {
                break;
            }
            parent = parentFqn(parent);
        }
        const fqn = el.modelRef ?? id;
        // If parent is not found in the map, check if it is in a group
        if (!parentNd && elementToGroup.has(fqn)) {
            const parentGroupId = nonNullable(elementToGroup.get(fqn));
            parentNd = nodesMap.get(parentGroupId);
            parent = parentGroupId;
        }
        if (parentNd) {
            // if parent has no children and we are about to add first one
            // we need to set its depth to 1
            if (parentNd.children.length == 0) {
                parentNd.depth = 1;
                // go up the tree and update depth of all parents
                updateDepthOfAncestors(parentNd, nodesMap);
            }
            parentNd.children.push(id);
            level = parentNd.level + 1;
        }
        const node = exact({
            id,
            parent,
            level,
            children: [],
            inEdges: [],
            outEdges: [],
            ...el,
        });
        nodesMap.set(id, node);
    });
    // Create new map and add elements in the same order as they were in the input
    const orderedMap = new Map();
    groups?.forEach(({ id }) => {
        orderedMap.set(id, nonNullable(nodesMap.get(id)));
    });
    elements.forEach(({ id }) => {
        orderedMap.set(id, nonNullable(nodesMap.get(id)));
    });
    return orderedMap;
}
