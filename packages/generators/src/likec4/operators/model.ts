import type { Fqn } from '@likec4/core/types'
import { nameFromFqn, parentFqn, sortParentsFirst } from '@likec4/core/utils'
import { hasAtLeast, isEmptyish, pipe, piped, values } from 'remeda'
import type {
  ElementData,
  LikeC4Data,
  RelationshipData,
} from '../types'
import {
  type AnyOp,
  type Op,
  body,
  foreach,
  foreachNewLine,
  inlineText,
  lazy,
  lines,
  noop,
  operation,
  print,
  property,
  select,
  separateNewLine,
  spaceBetween,
  when,
  withctx,
} from './base'
import {
  descriptionProperty,
  enumProperty,
  linksProperty,
  metadataProperty,
  styleProperties,
  summaryProperty,
  tagsProperty,
  technologyProperty,
} from './properties'

// --- Tree building ---

interface ElementTreeNode {
  name: string
  element: ElementData
  children: ElementTreeNode[]
}

function buildTree(elements: ElementData[]): {
  roots: readonly ElementTreeNode[]
  nodes: ReadonlyMap<Fqn, ElementTreeNode>
  exists: (fqn: Fqn) => boolean
} {
  const nodes = new Map<Fqn, ElementTreeNode>()
  const roots: ElementTreeNode[] = []
  const sorted = pipe(
    elements,
    sortParentsFirst,
  )

  for (const element of sorted) {
    const name = nameFromFqn(element.id)
    const node: ElementTreeNode = { name, element, children: [] }
    nodes.set(element.id, node)

    const parentId = parentFqn(element.id)
    const parent = parentId ? nodes.get(parentId) : undefined

    if (parent) {
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return {
    roots,
    nodes,
    exists: (fqn: Fqn) => nodes.has(fqn),
  }
}

// --- Predicates ---

function hasStyleProps(el: ElementData): boolean {
  return !isEmptyish(el.style)
}

function hasElementProps(el: ElementData): boolean {
  return !!(
    el.description || el.summary || el.technology || el.notation
    || (el.tags && el.tags.length > 0)
    || (el.links && el.links.length > 0)
    || !isEmptyish(el.metadata)
    || hasStyleProps(el)
  )
}

// --- Element ---

function elementProperties(): Op<ElementData> {
  return lines<ElementData>(
    tagsProperty(),
    technologyProperty(),
    summaryProperty(),
    descriptionProperty(),
    linksProperty(),
    metadataProperty(),
    select(
      e => hasStyleProps(e) ? e.style : undefined,
      body('style')(
        styleProperties(),
      ),
    ),
  )
}

export function printElement(node: ElementTreeNode): AnyOp {
  return withctx(node, elementOp())
}

export function elementOp(): Op<ElementTreeNode> {
  return operation(({ ctx: node, out }) => {
    const el = node.element
    const needsBody = node.children.length > 0 || hasElementProps(el)

    const inline: AnyOp[] = [
      print(node.name),
      print('='),
      print(el.kind),
    ]

    if (el.title && el.title !== node.name) {
      inline.push(inlineText(el.title))
    }

    if (needsBody) {
      inline.push(
        body(
          lines(2)(
            withctx(el, elementProperties()),
            ...node.children.map(child => printElement(child)),
          ),
        ),
      )
    }

    return spaceBetween(...inline)({ ctx: node, out }).out
  })
}

// --- Relationship ---

function hasRelationStyle(rel: RelationshipData): boolean {
  return !!(
    rel.color || rel.line || rel.head || rel.tail
  )
}

function hasRelationProps(rel: RelationshipData): boolean {
  return !!(
    rel.description || rel.summary || rel.technology
    || (rel.tags && rel.tags.length > 0)
    || (rel.links && rel.links.length > 0)
    || !isEmptyish(rel.metadata)
    || hasRelationStyle(rel)
    || rel.navigateTo
  )
}

function relationProperties(): Op<RelationshipData> {
  return body(
    tagsProperty(),
    technologyProperty(),
    summaryProperty(),
    descriptionProperty(),
    enumProperty('navigateTo'),
    linksProperty(),
    metadataProperty(),
    when(
      hasRelationStyle,
      body('style')(
        enumProperty('color'),
        enumProperty('head'),
        enumProperty('tail'),
        enumProperty('line'),
      ),
    ),
  )
}

export function printRelationship(rel: RelationshipData): AnyOp {
  const arrow = rel.kind ? `-[${rel.kind}]->` : '->'

  const inline: AnyOp[] = [
    print(rel.source.model),
    print(arrow),
    print(rel.target.model),
  ]

  if (rel.title) {
    inline.push(inlineText(rel.title))
  }

  if (hasRelationProps(rel)) {
    inline.push(
      withctx(rel, relationProperties()),
    )
  }

  return spaceBetween(...inline)
}

export function relationshipOp(): Op<RelationshipData> {
  return spaceBetween(
    print(rel => rel.source.model),
    print(rel => rel.kind ? `-[${rel.kind}]->` : '->'),
    print(rel => rel.target.model),
    property(
      'title',
      inlineText(),
    ),
    when(
      hasRelationProps,
      relationProperties(),
    ),
  )
}

// --- Main ---

export function modelOp<A extends Pick<LikeC4Data, 'elements' | 'relations'>>(): Op<A> {
  return body('model')(
    lines(2)(
      select(
        d => buildTree(d.elements ? values(d.elements) : []).roots,
        lines(2)(
          foreach(
            elementOp(),
          ),
        ),
      ),
      select(
        d => d.relations ? values(d.relations) : [],
        lines(2)(
          foreach(
            relationshipOp(),
          ),
        ),
      ),
    ),
  )
}

export function printModel({ elements, relations }: Pick<LikeC4Data, 'elements' | 'relations'>): AnyOp {
  if (isEmptyish(elements) && isEmptyish(relations)) {
    return noop()
  }

  return withctx({ elements, relations }, modelOp())
  // const ops: AnyOp[] = []

  // const tree = buildTree(elements ? values(elements) : [])
  // if (hasAtLeast(tree.roots, 1)) {
  //   ops.push(
  //     ...tree.roots.map(elementOp),
  //   )
  // }

  // const rels = relations ? values(relations) : []
  // if (hasAtLeast(rels, 1)) {
  //   ops.push(
  //     ...rels.map(relationshipOp),
  //   )
  // }

  // if (hasAtLeast(ops, 1)) {
  //   return body('model')(
  //     lines(2)(
  //       ...ops,
  //     ),
  //   )
  // }

  // return noop
}
