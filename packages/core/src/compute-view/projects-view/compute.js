import { entries, flatMap, hasAtLeast, isEmpty, keys, map, only, prop, unique } from 'remeda';
import { _stage, _type, GlobalFqn, preferSummary, ProjectId, } from '../../types';
import { invariant, nonNullable, stringHash } from '../../utils';
import { DefaultMap } from '../../utils/mnemonist';
import { linkNodesWithEdges } from '../utils/link-nodes-with-edges';
import { topologicalSort } from '../utils/topological-sort';
const keysCount = (object) => keys(object).length;
const nodeId = (projectId) => stringHash(projectId);
/**
 * Computes an overview of projects and their relationships
 */
export function computeProjectsView(likec4models) {
    const nodesMap = buildNodesForEachModel(likec4models);
    const key = (from, to) => `${from}->${to}`;
    const relationships = new DefaultMap((key) => {
        const [from, to] = key.split('->');
        return {
            from: from,
            to: to,
            relationships: new Set(),
        };
    });
    const relationshipsFromTo = (from, to) => relationships.get(key(from, to)).relationships;
    const processImportedElement = (model, importedElement) => {
        const projectId = importedElement.projectId;
        invariant(projectId !== model.projectId, 'Imported element must have a different project id');
        // Incoming relationships to imported element
        const incoming = relationshipsFromTo(model.projectId, projectId);
        for (const rel of importedElement.incoming('direct')) {
            if (rel.source.projectId === model.projectId) {
                incoming.add(rel);
            }
        }
        // At the moment (v1.46) there is no outgoing relationships from imported elements to models
        // But we still compute them for future-proofing
        const outgoing = relationshipsFromTo(projectId, model.projectId);
        for (const rel of importedElement.outgoing('direct')) {
            if (rel.target.projectId === model.projectId) {
                outgoing.add(rel);
            }
        }
    };
    // Compute relationships between projects based on imports
    for (const model of likec4models) {
        if (isEmpty(model.$data.imports)) {
            continue;
        }
        for (const [projectId, imported] of entries(model.$data.imports)) {
            for (const importedElement of imported) {
                const fqn = GlobalFqn(projectId, importedElement.id);
                processImportedElement(model, nonNullable(model.findElement(fqn), `Element ${importedElement.id} from project ${projectId} not found in model ${model.projectId}`));
            }
        }
    }
    // Convert set of relationships to edge
    const edges = Array.from(relationships.entries())
        .filter(([_, { relationships }]) => relationships.size > 0)
        .map(([key, { from, to, relationships: relationshipsSet }]) => {
        const relationships = [...relationshipsSet];
        invariant(hasAtLeast(relationships, 1), 'Relationships set must have at least one relationship');
        const edge = {
            id: stringHash(key),
            source: nodeId(from),
            target: nodeId(to),
            projectId: from,
            relations: map(relationships, prop('id')),
            label: null,
            color: 'gray',
            parent: null,
            line: 'solid',
            tags: unique(flatMap(relationships, prop('tags'))),
        };
        const onlyOne = only(relationships);
        if (onlyOne) {
            edge.label = onlyOne.title;
            edge.description = preferSummary(onlyOne.$relationship) ?? null;
            edge.technology = onlyOne.technology;
            edge.color = onlyOne.color;
            edge.line = onlyOne.line;
            if (onlyOne.kind) {
                edge.kind = onlyOne.kind;
            }
            if (onlyOne.$relationship.navigateTo) {
                edge.navigateTo = onlyOne.$relationship.navigateTo;
            }
        }
        return edge;
    });
    linkNodesWithEdges(nodesMap, edges);
    const sorted = topologicalSort({
        nodes: nodesMap,
        edges,
    });
    return {
        id: 'projects-view',
        [_type]: 'projects',
        [_stage]: 'computed',
        title: 'Projects',
        description: {
            txt: 'Overview of all projects and their relationships',
        },
        autoLayout: {
            direction: 'TB',
        },
        ...sorted,
    };
}
function buildNodesForEachModel(likec4models) {
    const nodesMap = new Map();
    for (const model of likec4models) {
        const projectId = ProjectId(model.projectId);
        const node = {
            id: nodeId(projectId),
            kind: '@project',
            parent: null,
            projectId,
            title: model.project.title ?? model.project.id,
            description: {
                txt: [
                    `Elements: ${keysCount(model.$data.elements)}`,
                    `Relationships: ${keysCount(model.$data.relations)}`,
                    `Views: ${keysCount(model.$data.views)}`,
                ].join('\n'),
            },
            shape: 'rectangle',
            children: [],
            inEdges: [],
            outEdges: [],
            color: 'primary',
            level: 0,
            style: {},
            tags: [],
        };
        nodesMap.set(node.id, node);
    }
    return nodesMap;
}
