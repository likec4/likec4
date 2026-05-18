// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import type { CurrentViewModel } from '@likec4/diagram'
import type { Types, XYStoreState } from '@likec4/diagram/custom'
import type { EdgeData, EdgeRelationData, ElementContextData, NodeData } from '@likec4/vite-plugin/ai/tools'

type Metadata = Record<string, unknown>
type LinkLike = {
  url: string
  title?: string | null
}
type RichTextLike = {
  isEmpty: boolean
  text: string | null
}
type ViewLike = {
  id: string
  title: string | null
  _type: 'element' | 'deployment' | 'dynamic'
}

type RelationLike = {
  id: string
  source: { id: string }
  target: { id: string }
  title: string | null
  technology: string | null
  metadata: Metadata
}

type ElementLike = {
  id: string
  title: string
  kind: string
  technology: string | null
  summary: RichTextLike
  description: RichTextLike
  tags: ReadonlyArray<string>
  links: ReadonlyArray<LinkLike>
  metadata: Metadata
  parent: ElementLike | null
  children(): Iterable<ElementLike>
  incoming(): Iterable<ElementRelationshipLike>
  outgoing(): Iterable<ElementRelationshipLike>
  views(): Iterable<ViewLike>
}

type ElementRelationshipLike = {
  id: string
  source: ElementLike
  target: ElementLike
  title: string | null
  technology: string | null
  metadata: Metadata
  links: ReadonlyArray<LinkLike>
}

type EdgeLike = {
  id: string
  source: { id: string }
  target: { id: string }
  label: string | null
  technology: string | null
  relationships(): Iterable<RelationLike>
}

type ViewModelLike = {
  edges(): Iterable<EdgeLike>
}

export type AIChatContextConfig = {
  element?: {
    summary?: boolean
    description?: boolean
    technology?: boolean
    tags?: boolean
    links?: boolean
    metadata?: boolean
    parent?: boolean
    children?: boolean
    incoming?: boolean
    outgoing?: boolean
    alsoAppearsInViews?: boolean
  }
  relationships?: {
    title?: boolean
    technology?: boolean
    metadata?: boolean
    links?: boolean
  }
  limits?: {
    children?: number
    relationships?: number
    views?: number
  }
}

export type ChatTemplateVariables = {
  title: string
  kind: string
  technology: string
  parent: string
  tags: string
  view: string
  dependencies: string
  dependents: string
}

export function mapToNodeData(storeState: XYStoreState) {
  return <T extends Types.NodeType>({ id, data, ...node }: Types.Node<T>): NodeData => {
    let icon = data.icon ?? undefined
    if (icon === 'none') {
      icon = undefined
    }

    let children = storeState.parentLookup.get(id)?.values().map(child => child.id).toArray()

    return {
      id,
      title: data.title,
      shape: data.shape,
      color: data.color,
      icon,
      parentId: node.parentId,
      children,
      x: data.x,
      y: data.y,
      width: node.measured?.width ?? node.width ?? node.initialWidth ?? 0,
      height: node.measured?.height ?? node.height ?? node.initialHeight ?? 0,
      ...('modelFqn' in data && data.modelFqn && { modelFqn: data.modelFqn }),
    }
  }
}

export function mapViewEdges(
  viewModel: CurrentViewModel,
  options: { includeRelations?: boolean } = {},
): EdgeData[] {
  return mapViewEdgeData(viewModel, options)
}

export function mapViewEdgeData(
  viewModel: ViewModelLike,
  options: { includeRelations?: boolean } = {},
): EdgeData[] {
  const includeRelations = options.includeRelations === true
  return [...viewModel.edges()].map(edge => ({
    id: edge.id,
    source: edge.source.id,
    target: edge.target.id,
    label: edge.label,
    technology: edge.technology,
    ...(includeRelations && {
      relations: [...edge.relationships()].map(mapRelationData),
    }),
  }))
}

export function mapElementContextData(
  element: ElementLike,
  currentView: ViewLike,
  context: AIChatContextConfig | undefined = undefined,
): ElementContextData {
  const elementConfig = context?.element
  const relationConfig = context?.relationships
  const childrenLimit = context?.limits?.children ?? 50
  const relationshipLimit = context?.limits?.relationships ?? 100
  const viewsLimit = context?.limits?.views ?? 20
  const metadata = normalizeMetadata(element.metadata)
  const summary = textFromRichText(element.summary)
  const description = textFromRichText(element.description)

  return {
    id: element.id,
    title: element.title,
    kind: element.kind,
    ...(elementConfig?.technology !== false && { technology: element.technology }),
    ...(elementConfig?.summary !== false && summary && { summary }),
    ...(elementConfig?.description !== false && description && { description }),
    ...(elementConfig?.tags !== false && element.tags.length > 0 && { tags: [...element.tags] }),
    ...(elementConfig?.links !== false && element.links.length > 0 && { links: [...element.links] }),
    ...(elementConfig?.metadata !== false && metadata && { metadata }),
    ...(elementConfig?.parent !== false && element.parent && { parent: mapElementRef(element.parent) }),
    ...(elementConfig?.children !== false && {
      children: limitItems(element.children(), childrenLimit).map(mapElementRef),
    }),
    ...(elementConfig?.incoming !== false && {
      incoming: limitItems(element.incoming(), relationshipLimit).map(relation =>
        mapElementRelationshipData(relation, relationConfig)
      ),
    }),
    ...(elementConfig?.outgoing !== false && {
      outgoing: limitItems(element.outgoing(), relationshipLimit).map(relation =>
        mapElementRelationshipData(relation, relationConfig)
      ),
    }),
    ...(elementConfig?.alsoAppearsInViews !== false && {
      alsoAppearsInViews: limitItems(element.views(), viewsLimit)
        .filter(view => view.id !== currentView.id)
        .map(mapViewRef),
    }),
  }
}

export function buildElementTemplateVariables(
  element: ElementLike | null,
  currentView: ViewLike,
): ChatTemplateVariables {
  if (!element) {
    return {
      title: '',
      kind: '',
      technology: '',
      parent: '',
      tags: '',
      view: currentView.title ?? currentView.id,
      dependencies: '',
      dependents: '',
    }
  }

  return {
    title: element.title,
    kind: element.kind,
    technology: element.technology ?? '',
    parent: element.parent?.title ?? '',
    tags: element.tags.join(', '),
    view: currentView.title ?? currentView.id,
    dependencies: uniqueTitles(element.outgoing(), relation => relation.target.title).join(', '),
    dependents: uniqueTitles(element.incoming(), relation => relation.source.title).join(', '),
  }
}

const TEMPLATE_VARIABLE_RE = /\{(\w+)\}/g

export function interpolateChatTemplate(
  template: string,
  variables: ChatTemplateVariables,
  { hideIfEmpty }: { hideIfEmpty: boolean },
): string | null {
  let hasEmptyVariable = false
  const result = template.replace(TEMPLATE_VARIABLE_RE, (match, key: string) => {
    if (!isTemplateVariable(key)) {
      return match
    }
    const value = variables[key]
    if (!value) {
      hasEmptyVariable = true
    }
    return value
  })
  return hideIfEmpty && hasEmptyVariable ? null : result
}

type DiagramContextLike = {
  focusedNode?: string | null
  xynodes: ReadonlyArray<{
    id: string
    selected?: boolean | undefined
    data: Record<string, unknown>
  }>
}

export function getSelectedElementId(context: DiagramContextLike): string | undefined {
  const node = context.xynodes.find(n => !!n.selected || n.id === context.focusedNode)
  return typeof node?.data['modelFqn'] === 'string' ? node.data['modelFqn'] : undefined
}

function mapRelationData(relation: RelationLike): EdgeRelationData {
  const metadata = normalizeMetadata(relation.metadata)
  return {
    id: relation.id,
    source: relation.source.id,
    target: relation.target.id,
    title: relation.title,
    technology: relation.technology,
    ...(metadata && { metadata }),
  }
}

function mapElementRelationshipData(
  relation: ElementRelationshipLike,
  context: AIChatContextConfig['relationships'] | undefined,
) {
  const metadata = normalizeMetadata(relation.metadata)
  return {
    id: relation.id,
    source: mapElementRef(relation.source),
    target: mapElementRef(relation.target),
    ...(context?.title !== false && { title: relation.title }),
    ...(context?.technology !== false && { technology: relation.technology }),
    ...(context?.metadata !== false && metadata && { metadata }),
    ...(context?.links === true && relation.links.length > 0 && { links: [...relation.links] }),
  }
}

function mapElementRef(element: ElementLike) {
  return {
    id: element.id,
    title: element.title,
    kind: element.kind,
    technology: element.technology,
  }
}

function mapViewRef(view: ViewLike) {
  return {
    id: view.id,
    title: view.title ?? '',
    type: view._type,
  }
}

function textFromRichText(value: RichTextLike): string | undefined {
  if (value.isEmpty || !value.text) {
    return undefined
  }
  const text = value.text.trim()
  return text ? text : undefined
}

function normalizeMetadata(metadata: Metadata): Record<string, string> | undefined {
  const stringifyValue = (value: unknown): string => {
    if (Array.isArray(value)) {
      return value.map(item => stringifyValue(item)).join(', ')
    }
    if (value !== null && typeof value === 'object') {
      try {
        return JSON.stringify(value)
      } catch {
        return '[unserializable]'
      }
    }
    return String(value)
  }

  const normalized = Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [
      key,
      stringifyValue(value),
    ]),
  )
  return Object.keys(normalized).length > 0 ? normalized : undefined
}

function limitItems<T>(items: Iterable<T>, limit: number): T[] {
  return [...items].slice(0, limit)
}

function uniqueTitles<T>(items: Iterable<T>, selectTitle: (item: T) => string): string[] {
  return [...new Set([...items].map(selectTitle))]
}

function isTemplateVariable(key: string): key is keyof ChatTemplateVariables {
  return [
    'title',
    'kind',
    'technology',
    'parent',
    'tags',
    'view',
    'dependencies',
    'dependents',
  ].includes(key)
}
