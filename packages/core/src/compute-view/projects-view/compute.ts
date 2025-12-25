import { entries, flatMap, isEmpty, keys, map, only, prop, unique } from 'remeda'
import type { ElementModel } from '../../model'
import { LikeC4Model } from '../../model/LikeC4Model'
import { RelationshipModel } from '../../model/RelationModel'
import {
  type Any,
  type ComputedEdge,
  type ComputedNode,
  type EdgeId,
  type NodeId,
  type NonEmptyArray,
  type ViewId,
  _stage,
  GlobalFqn,
  preferSummary,
} from '../../types'
import { invariant, nonNullable, stringHash } from '../../utils'
import { DefaultMap } from '../../utils/mnemonist'
import { topologicalSort } from '../utils/topological-sort'
import type { ComputedProjectsView } from './_types'

const keysCount = (object: Record<string, unknown>): number => keys(object).length

/**
 * Computes an overview of projects and their relationships
 */
export function computeProjectsView(
  likec4models: NonEmptyArray<LikeC4Model>,
): ComputedProjectsView {
  const nodesMap = buildNodesForEachModel(likec4models)

  const getNode = (id: NodeId): ComputedNode => {
    return nonNullable(nodesMap.get(id), `Node ${id} not found`)
  }

  const key = (from: string, to: string): string => `${from}->${to}`
  const relationships = new DefaultMap<string, {
    source: NodeId
    target: NodeId
    relationships: Set<RelationshipModel>
  }>((key: string) => {
    const [source, target] = key.split('->')
    return {
      source: source as NodeId,
      target: target as NodeId,
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
    .map(([key, { source, target, relationships: relationshipsSet }]): ComputedEdge => {
      const relationships = [...relationshipsSet]

      const edge: ComputedEdge = {
        id: stringHash(key) as unknown as EdgeId,
        source,
        target,
        relations: map(relationships, prop('id')),
        label: null,
        color: 'gray',
        parent: null,
        line: 'solid',
        tags: unique(flatMap(relationships, prop('tags'))),
      }
      getNode(source).outEdges.push(edge.id)
      getNode(target).inEdges.push(edge.id)

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

  const sorted = topologicalSort({
    nodes: nodesMap,
    edges,
  })

  return {
    id: 'projects-view' as ViewId,
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
function buildNodesForEachModel(likec4models: NonEmptyArray<LikeC4Model<Any>>): Map<NodeId, ComputedNode> {
  const nodesMap = new Map<NodeId, ComputedNode>()
  for (const model of likec4models) {
    const node: ComputedNode = {
      id: model.projectId as NodeId,
      kind: '@project',
      parent: null,
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
