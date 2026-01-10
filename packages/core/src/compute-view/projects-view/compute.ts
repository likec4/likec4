import { entries, flatMap, hasAtLeast, isEmpty, keys, map, only, prop, unique } from 'remeda'
import type { ElementModel } from '../../model'
import { LikeC4Model } from '../../model/LikeC4Model'
import { RelationshipModel } from '../../model/RelationModel'
import {
  type Any,
  type EdgeId,
  type NonEmptyArray,
  type ViewId,
  _stage,
  _type,
  GlobalFqn,
  NodeId,
  preferSummary,
  ProjectId,
} from '../../types'
import { invariant, nonNullable, stringHash } from '../../utils'
import { DefaultMap } from '../../utils/mnemonist'
import { linkNodesWithEdges } from '../utils/link-nodes-with-edges'
import { topologicalSort } from '../utils/topological-sort'
import type { ComputedProjectEdge, ComputedProjectNode, ComputedProjectsView } from './_types'

const keysCount = (object: Record<string, unknown>): number => keys(object).length

const nodeId = (projectId: ProjectId): NodeId => stringHash(projectId) as unknown as NodeId

/**
 * Computes an overview of projects and their relationships
 */
export function computeProjectsView(
  likec4models: NonEmptyArray<LikeC4Model>,
): ComputedProjectsView {
  const nodesMap = buildNodesForEachModel(likec4models)

  const key = (from: string, to: string): string => `${from}->${to}`
  const relationships = new DefaultMap<string, {
    from: ProjectId
    to: ProjectId
    relationships: Set<RelationshipModel>
  }>((key: string) => {
    const [from, to] = key.split('->')
    return {
      from: from as ProjectId,
      to: to as ProjectId,
      relationships: new Set(),
    }
  })
  const relationshipsFromTo = (from: string, to: string): Set<RelationshipModel> =>
    relationships.get(key(from, to)).relationships

  const processImportedElement = (model: LikeC4Model, importedElement: ElementModel) => {
    const projectId = importedElement.projectId
    invariant(projectId !== model.projectId, 'Imported element must have a different project id')

    // Incoming relationships to imported element
    const incoming = relationshipsFromTo(model.projectId, projectId)
    for (const rel of importedElement.incoming('direct')) {
      if (rel.source.projectId === model.projectId) {
        incoming.add(rel)
      }
    }

    // At the moment (v1.46) there is no outgoing relationships from imported elements to models
    // But we still compute them for future-proofing
    const outgoing = relationshipsFromTo(projectId, model.projectId)
    for (const rel of importedElement.outgoing('direct')) {
      if (rel.target.projectId === model.projectId) {
        outgoing.add(rel)
      }
    }
  }

  // Compute relationships between projects based on imports
  for (const model of likec4models) {
    if (isEmpty(model.$data.imports)) {
      continue
    }

    for (const [projectId, imported] of entries(model.$data.imports)) {
      for (const importedElement of imported) {
        const fqn = GlobalFqn(projectId, importedElement.id)
        processImportedElement(
          model,
          nonNullable(
            model.findElement(fqn),
            `Element ${importedElement.id} from project ${projectId} not found in model ${model.projectId}`,
          ),
        )
      }
    }
  }

  // Convert set of relationships to edge
  const edges = Array.from(relationships.entries())
    .filter(([_, { relationships }]) => relationships.size > 0)
    .map(([key, { from, to, relationships: relationshipsSet }]): ComputedProjectEdge => {
      const relationships = [...relationshipsSet]
      invariant(hasAtLeast(relationships, 1), 'Relationships set must have at least one relationship')

      const edge: ComputedProjectEdge = {
        id: stringHash(key) as unknown as EdgeId,
        source: nodeId(from),
        target: nodeId(to),
        projectId: from,
        relations: map(relationships, prop('id')),
        label: null,
        color: 'gray',
        parent: null,
        line: 'solid',
        tags: unique(flatMap(relationships, prop('tags'))),
      }

      const onlyOne = only(relationships)
      if (onlyOne) {
        edge.label = onlyOne.title
        edge.description = preferSummary(onlyOne.$relationship) ?? null
        edge.technology = onlyOne.technology
        edge.color = onlyOne.color
        edge.line = onlyOne.line
        if (onlyOne.kind) {
          edge.kind = onlyOne.kind
        }
        if (onlyOne.$relationship.navigateTo) {
          edge.navigateTo = onlyOne.$relationship.navigateTo
        }
      }

      return edge
    })

  linkNodesWithEdges(nodesMap, edges)

  const sorted = topologicalSort({
    nodes: nodesMap,
    edges,
  })

  return {
    id: 'projects-view' as ViewId,
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
  }
}
function buildNodesForEachModel(likec4models: NonEmptyArray<LikeC4Model<Any>>): Map<NodeId, ComputedProjectNode> {
  const nodesMap = new Map<NodeId, ComputedProjectNode>()
  for (const model of likec4models) {
    const projectId = ProjectId(model.projectId)
    const node: ComputedProjectNode = {
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
    }
    nodesMap.set(node.id, node)
  }
  return nodesMap
}
