import { nameFromFqn, parentFqn, sortParentsFirst } from '@likec4/core'
import type { Element, Fqn, Relationship } from '@likec4/core/types'
import { isEmptyish, pipe, values } from 'remeda'
import {
  type AnyOp,
  type Op,
  body,
  inlineText,
  lines,
  print,
  spaceBetween,
  when,
  withctx,
} from './base'
import {
  colorProperty,
  descriptionProperty,
  enumProperty,
  linksProperty,
  metadataProperty,
  styleProperty,
  summaryProperty,
  tagsProperty,
  technologyProperty,
} from './properties'

// --- Tree building ---

interface ElementTreeNode {
  name: string
  element: Element
  children: ElementTreeNode[]
}

function buildTree(elements: Record<string, Element>): ElementTreeNode[] {
  const nodeMap = new Map<Fqn, ElementTreeNode>()
  const roots: ElementTreeNode[] = []
  const sorted = pipe(
    values(elements),
    sortParentsFirst,
  )

  for (const element of sorted) {
    const name = nameFromFqn(element.id)
    const node: ElementTreeNode = { name, element, children: [] }
    nodeMap.set(element.id, node)

    const parentId = parentFqn(element.id)
    const parent = parentId ? nodeMap.get(parentId) : undefined

    if (parent) {
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

// --- Predicates ---

function hasStyleProps(el: Element): boolean {
  return !isEmptyish(el.style)
}

function hasElementProps(el: Element): boolean {
  return !!(
    el.description || el.summary || el.technology || el.notation
    || (el.tags && el.tags.length > 0)
    || (el.links && el.links.length > 0)
    || !isEmptyish(el.metadata)
    || hasStyleProps(el)
  )
}

function hasRelationStyle(rel: Relationship): boolean {
  return !!(
    rel.color || rel.line || rel.head || rel.tail
  )
}

function hasRelationProps(rel: Relationship): boolean {
  return !!(
    rel.description || rel.summary || rel.technology
    || (rel.tags && rel.tags.length > 0)
    || (rel.links && rel.links.length > 0)
    || !isEmptyish(rel.metadata)
    || hasRelationStyle(rel)
    || rel.navigateTo
  )
}

// --- Element ---

function elementProperties(): Op<Element> {
  return lines(
    tagsProperty(),
    technologyProperty(),
    summaryProperty(),
    descriptionProperty(),
    linksProperty(),
    metadataProperty(),
    when(
      hasStyleProps,
      styleProperty(),
    ),
  )
}

function elementOp(node: ElementTreeNode): AnyOp {
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
          ...node.children.map(elementOp),
        ),
      ),
    )
  }

  return spaceBetween(...inline)
}

// --- Relationship ---

function relationProperties(): Op<Relationship> {
  return lines(
    tagsProperty(),
    technologyProperty(),
    summaryProperty(),
    descriptionProperty(),
    linksProperty(),
    metadataProperty(),
    enumProperty('navigateTo'),
    when(
      hasRelationStyle,
      body('style')(
        colorProperty(),
        enumProperty('line'),
        enumProperty('head'),
        enumProperty('tail'),
      ),
    ),
  )
}

function relationshipOp(rel: Relationship): AnyOp {
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
    inline.push(body(
      withctx(rel)(relationProperties()),
    ))
  }

  return spaceBetween(...inline)
}

// --- Main ---
export type PrintModelCtx = {
  elements: Record<string, Element>
  relations: Record<string, Relationship>
}

export function printModel(ctx: PrintModelCtx): AnyOp {
  const tree = buildTree(ctx.elements)
  const rels = Object.values(ctx.relations)

  return body('model')(
    lines(2)(
      ...tree.map(node => elementOp(node)),
      ...rels.map(rel => relationshipOp(rel)),
    ),
  )
}
