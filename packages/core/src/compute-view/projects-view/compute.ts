import { entries, flatMap, hasAtLeast, isEmpty, keys, map, only, prop, unique } from 'remeda'
import type { ElementModel } from '../../model'
import { LikeC4Model } from '../../model/LikeC4Model'
import { RelationshipModel } from '../../model/RelationModel'
import { styleDefaults } from '../../styles/defaults'
import type { ThemeColor } from '../../styles/types'
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
import type {
  ComputedProjectEdge,
  ComputedProjectGroupNode,
  ComputedProjectNode,
  ComputedProjectsNode,
  ComputedProjectsView,
  ProjectsOverviewGroupBy,
  ProjectsOverviewLegend,
  ProjectsOverviewLegendEntry,
  ProjectsOverviewOptions,
} from './_types'

const keysCount = (object: Record<string, unknown>): number => keys(object).length

const nodeId = (projectId: ProjectId): NodeId => stringHash(projectId) as unknown as NodeId

/**
 * Computes an overview of projects and their relationships
 */
export function computeProjectsView(
  likec4models: NonEmptyArray<LikeC4Model>,
  options?: ProjectsOverviewOptions,
): ComputedProjectsView {
  const excludedProjects = new Set<ProjectId>(
    likec4models
      .filter(model => isExcludedProject(model.project.metadata, options))
      .map(model => ProjectId(model.projectId)),
  )
  const shownModels = likec4models.filter(model => !excludedProjects.has(ProjectId(model.projectId)))
  const metadataByProject = new Map<ProjectId, Record<string, unknown> | undefined>()
  const nodesMap = buildNodesForEachModel(shownModels, metadataByProject, options)

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
  for (const model of shownModels) {
    if (isEmpty(model.$data.imports)) {
      continue
    }

    for (const [projectId, imported] of entries(model.$data.imports)) {
      if (excludedProjects.has(ProjectId(projectId))) {
        continue
      }
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
    .filter((entry) => entry[1].relationships.size > 0)
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
  const nodes = options?.groupBy
    ? groupProjects(sorted.nodes, metadataByProject, options.groupBy, options.order ?? [])
    : sorted.nodes

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
    ...(options?.routing === 'ortho' ? { routing: 'ortho' as const } : {}),
    ...(options?.order?.length ? { layers: topLevelGroupIds(nodes) } : {}),
    ...(options?.colorBy ? { legend: colorLegend(options.colorBy, nodes, metadataByProject) } : {}),
    nodes,
    edges: sorted.edges,
  }
}

function colorLegend(
  colorBy: NonNullable<ProjectsOverviewOptions['colorBy']>,
  nodes: ReadonlyArray<ComputedProjectsNode>,
  metadataByProject: ReadonlyMap<ProjectId, Record<string, unknown> | undefined>,
): ProjectsOverviewLegend {
  const counts = new Map<string, number>()
  for (const node of nodes) {
    if (node.kind !== '@project') {
      continue
    }
    const value = projectsOverviewValue(metadataByProject.get(node.projectId), colorBy.key)
    if (value !== null) {
      counts.set(value, (counts.get(value) ?? 0) + 1)
    }
  }
  const entries = [...counts.keys()].sort(compareText).map((value): ProjectsOverviewLegendEntry => ({
    value,
    color: mappedColor(colorBy.colors, value) ?? 'primary',
    count: counts.get(value)!,
  }))
  return { colorBy: { key: colorBy.key, entries } }
}

function isExcludedProject(
  metadata: Record<string, unknown> | undefined,
  options: ProjectsOverviewOptions | undefined,
): boolean {
  const exclude = options?.exclude
  if (!exclude) {
    return false
  }
  const value = projectsOverviewValue(metadata, exclude.key)
  return value !== null && exclude.values.includes(value)
}

function buildNodesForEachModel(
  likec4models: ReadonlyArray<LikeC4Model<Any>>,
  metadataByProject: Map<ProjectId, Record<string, unknown> | undefined>,
  options: ProjectsOverviewOptions | undefined,
): Map<NodeId, ComputedProjectNode> {
  const nodesMap = new Map<NodeId, ComputedProjectNode>()
  for (const model of likec4models) {
    const projectId = ProjectId(model.projectId)
    const metrics = {
      elements: keysCount(model.$data.elements),
      relationships: keysCount(model.$data.relations),
      views: keysCount(model.$data.views),
    }
    const metadata = model.project.metadata
    metadataByProject.set(projectId, metadata)
    const node: ComputedProjectNode = {
      id: nodeId(projectId),
      kind: '@project',
      parent: null,
      projectId,
      title: model.project.title ?? model.project.id,
      description: {
        txt: [
          `Elements: ${metrics.elements}`,
          `Relationships: ${metrics.relationships}`,
          `Views: ${metrics.views}`,
        ].join('\n'),
      },
      shape: 'rectangle',
      children: [],
      inEdges: [],
      outEdges: [],
      color: projectColor(metadata, options),
      level: 0,
      style: {},
      tags: [],
      metrics,
    }
    nodesMap.set(node.id, node)
  }
  return nodesMap
}

/**
 * A metadata value used for grouping and coloring.
 * Strings are trimmed. Numbers and booleans become their text. Other values are ignored.
 */
export function projectsOverviewValue(
  metadata: Record<string, unknown> | undefined,
  key: string,
): string | null {
  if (metadata == null || !Object.hasOwn(metadata, key)) {
    return null
  }
  const value = metadata[key]
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }
  if (typeof value === 'boolean') {
    return String(value)
  }
  return null
}

function projectColor(
  metadata: Record<string, unknown> | undefined,
  options: ProjectsOverviewOptions | undefined,
): ThemeColor {
  const colorBy = options?.colorBy
  if (!colorBy) {
    return 'primary'
  }
  const value = projectsOverviewValue(metadata, colorBy.key)
  if (value == null) {
    return 'primary'
  }
  return mappedColor(colorBy.colors, value) ?? 'primary'
}

function mappedColor(
  colors: Readonly<Record<string, ThemeColor>> | undefined,
  value: string,
): ThemeColor | undefined {
  return colors && Object.hasOwn(colors, value) ? colors[value] : undefined
}

function topLevelGroupIds(nodes: ReadonlyArray<ComputedProjectsNode>): NodeId[] {
  return nodes.filter(node => node.kind === '@group' && node.parent === null).map(node => node.id)
}

function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

/** Ranks listed values by their position. Unlisted values share one rank and sort alphabetically. */
function compareByOrder(order: readonly string[]): (a: string, b: string) => number {
  const ranks = new Map(order.map((value, index) => [value, index] as const))
  const rankOf = (value: string) => ranks.get(value) ?? order.length
  return (a, b) => rankOf(a) - rankOf(b) || compareText(a, b)
}

function groupProjects(
  projects: ReadonlyArray<ComputedProjectNode>,
  metadataByProject: ReadonlyMap<ProjectId, Record<string, unknown> | undefined>,
  groupBy: ProjectsOverviewGroupBy,
  order: readonly string[],
): ComputedProjectsNode[] {
  const projectNodes = projects.filter((node): node is ComputedProjectNode => node.kind === '@project')
  const groups: ComputedProjectGroupNode[] = []

  const visit = (
    members: readonly ComputedProjectNode[],
    level: ProjectsOverviewGroupBy | undefined,
    parentId: NodeId | null,
    parentLevel: number,
    path: readonly string[],
    seen: ReadonlySet<string>,
  ) => {
    for (const member of members) {
      member.parent = parentId
      member.level = parentLevel
    }
    if (!level || seen.has(level.key)) {
      return
    }
    const nextSeen = new Set(seen)
    nextSeen.add(level.key)
    const buckets = new Map<string, ComputedProjectNode[]>()
    for (const member of members) {
      const value = projectsOverviewValue(metadataByProject.get(member.projectId), level.key)
      if (value == null) {
        continue
      }
      const bucket = buckets.get(value)
      if (bucket) {
        bucket.push(member)
      } else {
        buckets.set(value, [member])
      }
    }
    const compareValues = parentId === null ? compareByOrder(order) : compareText
    for (const value of [...buckets.keys()].sort(compareValues)) {
      const bucket = buckets.get(value)!
      const id = stringHash(JSON.stringify(['@group', ...path, level.key, value])) as unknown as NodeId
      const group: ComputedProjectGroupNode = {
        id,
        kind: '@group',
        parent: parentId,
        title: value,
        description: null,
        shape: 'rectangle',
        color: mappedColor(level.colors, value) ?? 'gray',
        children: [],
        inEdges: [],
        outEdges: [],
        level: parentLevel,
        depth: 0,
        style: {
          border: styleDefaults.group.border,
          opacity: styleDefaults.group.opacity,
        },
        tags: [],
      }
      groups.push(group)
      visit(bucket, level.thenBy, id, parentLevel + 1, [...path, level.key, value], nextSeen)
      group.children = [
        ...groups.filter(child => child.parent === id).map(child => child.id),
        ...bucket.filter(member => member.parent === id).map(member => member.id),
      ]
    }
  }

  visit(projectNodes, groupBy, null, 0, [], new Set())
  const byId = new Map<NodeId, ComputedProjectsNode>([
    ...projectNodes.map(node => [node.id, node] as const),
    ...groups.map(node => [node.id, node] as const),
  ])
  const depthOf = (id: NodeId): number => {
    const node = byId.get(id)
    if (!node || node.children.length === 0) {
      return 0
    }
    const depth = 1 + Math.max(...node.children.map(depthOf))
    node.depth = depth
    return depth
  }
  for (const group of groups) {
    if (group.parent === null) {
      depthOf(group.id)
    }
  }
  return flattenProjects(null, projectNodes, groups)
}

function flattenProjects(
  parentId: NodeId | null,
  projects: readonly ComputedProjectNode[],
  groups: readonly ComputedProjectGroupNode[],
): ComputedProjectsNode[] {
  const childGroups = groups.filter(group => group.parent === parentId)
  const childProjects = projects.filter(project => project.parent === parentId)
  return [
    ...childGroups.flatMap(group => [group, ...flattenProjects(group.id, projects, groups)]),
    ...childProjects,
  ]
}
