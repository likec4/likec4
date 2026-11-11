import { entries, flatMap, hasAtLeast, isEmpty, keys, map, only, prop, unique } from 'remeda'
import type { ElementModel } from '../../model'
import { LikeC4Model } from '../../model/LikeC4Model'
import { RelationshipModel } from '../../model/RelationModel'
import {
  type Any,
  type EdgeId,
  type ImportedProjectMeta,
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
 * Synthetic project id of an external project node: `<importName>@<importedBy>`.
 * Workspace project ids can't contain `@`, so it never collides with them.
 */
const externalProjectId = (importedBy: ProjectId, importName: ProjectId): ProjectId =>
  ProjectId(`${importName}@${importedBy}`)

/**
 * Computes an overview of projects and their relationships
 *
 * Imports are resolved using the import metadata of the model ({@link LikeC4Model.findImportedProject}):
 * - import of a workspace project (possibly under another name) is linked to the node of that project
 * - import of an external project (any other source) gets its own node,
 *   one per importing project and import name
 * - import without metadata is linked to the workspace project with the same id as the import name
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

  /**
   * Resolves the project id of the node, that represents the project imported by the model under `importName`.
   * Creates a node for an external project, if needed.
   */
  const resolveImportedProject = (model: LikeC4Model, importName: ProjectId): ProjectId => {
    const meta = model.findImportedProject(importName)
    if (!meta) {
      return importName
    }
    switch (true) {
      case meta.source.kind === 'workspace': {
        return meta.source.projectId
      }
      default: {
        const importedBy = ProjectId(model.projectId)
        const projectId = externalProjectId(importedBy, importName)
        const id = nodeId(projectId)
        if (!nodesMap.has(id)) {
          nodesMap.set(id, externalProjectNode({ projectId, importedBy, importName, meta, model }))
        }
        return projectId
      }
    }
  }

  const processImportedElement = (model: LikeC4Model, projectId: ProjectId, importedElement: ElementModel) => {
    invariant(importedElement.projectId !== model.projectId, 'Imported element must have a different project id')

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

    for (const [importName, imported] of entries(model.$data.imports)) {
      const projectId = resolveImportedProject(model, importName)
      for (const importedElement of imported) {
        const fqn = GlobalFqn(importName, importedElement.id)
        processImportedElement(
          model,
          projectId,
          nonNullable(
            model.findElement(fqn),
            `Element ${importedElement.id} from project ${importName} not found in model ${model.projectId}`,
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

function externalProjectNode({ projectId, importedBy, importName, meta, model }: {
  projectId: ProjectId
  importedBy: ProjectId
  importName: ProjectId
  meta: ImportedProjectMeta
  model: LikeC4Model<Any>
}): ComputedProjectNode {
  const description = [
    `External project, imported by ${model.project.title ?? importedBy} as "${importName}"`,
  ]
  switch (meta.source.kind) {
    case 'local': {
      description.push(`Source: ${meta.source.path}`)
      break
    }
  }
  return {
    id: nodeId(projectId),
    kind: '@project',
    parent: null,
    projectId,
    title: meta.name || importName,
    description: {
      txt: description.join('\n'),
    },
    shape: 'rectangle',
    children: [],
    inEdges: [],
    outEdges: [],
    color: 'muted',
    level: 0,
    style: {},
    tags: [],
    external: {
      importedBy,
      importName,
      source: meta.source,
    },
  }
}
