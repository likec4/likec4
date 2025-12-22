import { entries, filter, isEmpty, map, pipe } from 'remeda'
import { LikeC4Model } from '../../model/LikeC4Model'
import { RelationshipModel } from '../../model/RelationModel'
import {
  type ComputedEdge,
  type ComputedNode,
  type EdgeId,
  type NodeId,
  type NonEmptyArray,
  type ViewId,
  _stage,
  GlobalFqn,
  ProjectId,
} from '../../types'
import { stringHash } from '../../utils'
import { DefaultMap } from '../../utils/mnemonist'
import { topologicalSort } from '../utils/topological-sort'
import type { ComputedProjectsView } from './_types'

export function computeProjectsView(
  likec4models: NonEmptyArray<LikeC4Model>,
): ComputedProjectsView {
  const nodes: ComputedNode[] = map(
    likec4models,
    (model): ComputedNode => ({
      id: model.projectId as NodeId,
      kind: '@project',
      title: model.project.title ?? model.project.id,
      shape: 'rectangle',
      children: [],
      parent: null,
      inEdges: [],
      outEdges: [],
      color: 'primary',
      level: 0,
      style: {},
      tags: [],
    }),
  )
  const nodesMap = new Map(nodes.map(node => [node.id, node]))

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

  pipe(
    likec4models,
    filter(model => !isEmpty(model.$data.imports)),
    map(model => {
      for (const [projectId, imported] of entries(model.$data.imports)) {
        imported
          .flatMap(e => model.findElement(GlobalFqn(projectId, e.id)) ?? [])
          .forEach((e) => {
            // Incoming relationships to imported element
            const incoming = relationships.get(key(model.projectId, projectId)).relationships
            for (const rel of e.incoming('direct')) {
              if (rel.source.projectId === model.projectId) {
                incoming.add(rel)
              }
            }

            // Outgoing relationships from imported element
            const outgoing = relationships.get(key(projectId, model.projectId)).relationships
            for (const rel of e.outgoing('direct')) {
              if (rel.target.projectId === model.projectId) {
                outgoing.add(rel)
              }
            }
          })
      }
    }),
  )

  const edges = Array.from(relationships.values())
    .filter(({ relationships }) => relationships.size > 0)
    .map(({ from, to, relationships }): ComputedEdge => {
      const edge: ComputedEdge = {
        id: stringHash(`${from}->${to}`) as unknown as EdgeId,
        source: from as unknown as NodeId,
        target: to as unknown as NodeId,
        relations: Array.from(relationships).map(r => r.id),
        label: null,
        color: 'gray',
        parent: null,
        line: 'solid',
      }

      nodesMap.get(edge.source)?.outEdges.push(edge.id)
      nodesMap.get(edge.target)?.inEdges.push(edge.id)

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
    ...sorted,
  }
}
