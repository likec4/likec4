import type { Element, ElementStyle, Relationship } from '@likec4/core/types'
import { isEmptyish } from 'remeda'
import {
  type AnyOp,
  type Op,
  body,
  foreach,
  inlineText,
  lines,
  operation,
  print,
  select,
  separateNewLine,
  spaceBetween,
  text,
  withctx,
} from './base'
import { styleProperties } from './print-style'
import {
  descriptionProperty,
  enumProperty,
  linksProperty,
  notationProperty,
  printTags,
  summaryProperty,
  technologyProperty,
} from './properties'

// --- Tree building ---

interface ElementTreeNode {
  name: string
  element: Element
  children: ElementTreeNode[]
}

function buildTree(elements: Record<string, Element>): ElementTreeNode[] {
  const nodeMap = new Map<string, ElementTreeNode>()
  const roots: ElementTreeNode[] = []
  const sorted = Object.entries(elements).sort(([a], [b]) => a.localeCompare(b))

  for (const [id, element] of sorted) {
    const parts = (id as string).split('.')
    const name = parts[parts.length - 1]!
    const node: ElementTreeNode = { name, element, children: [] }
    nodeMap.set(id, node)

    const parentId = parts.slice(0, -1).join('.')
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

function hasStyleProps(style: ElementStyle): boolean {
  return !isEmptyish(style)
}

function hasElementProps(el: Element): boolean {
  return !!(
    el.description || el.summary || el.technology || el.notation
    || (el.tags && el.tags.length > 0)
    || (el.links && el.links.length > 0)
    || (el.metadata && Object.keys(el.metadata).length > 0)
    || hasStyleProps(el.style)
  )
}

function hasRelationProps(rel: Relationship): boolean {
  return !!(
    rel.description || rel.summary || rel.technology
    || (rel.tags && rel.tags.length > 0)
    || (rel.links && rel.links.length > 0)
    || (rel.metadata && Object.keys(rel.metadata).length > 0)
    || rel.color || rel.line || rel.head || rel.tail
    || rel.navigateTo
  )
}

// --- Metadata (handles string | string[]) ---

function metadataBlock<A extends { metadata?: Record<string, unknown> | null }>(): Op<A> {
  return select(
    (e: A) => {
      const md = e.metadata
      if (!md) return undefined
      const entries = Object.entries(md)
      return entries.length > 0 ? entries : undefined
    },
    body('metadata')(
      foreach(
        operation<[string, unknown]>(({ ctx: [key, value], out }) => {
          out.append(key, ' ')
          if (Array.isArray(value)) {
            const items = value.map((v: string) => `'${String(v).replaceAll('\'', '\\\'')}'`)
            out.append(`[${items.join(', ')}]`)
          } else {
            text(String(value))({ ctx: String(value), out })
          }
        }),
        separateNewLine(),
      ),
    ),
  )
}

// --- Style (only if has props) ---

function elementStyleBlock(): Op<Element> {
  return select(
    (e: Element) => hasStyleProps(e.style) ? e.style : undefined,
    body('style')(
      styleProperties(),
    ),
  )
}

// --- Element ---

function elementProperties(): Op<Element> {
  return lines(
    printTags(),
    descriptionProperty(),
    summaryProperty(),
    technologyProperty(),
    notationProperty(),
    linksProperty(),
    metadataBlock(),
    elementStyleBlock(),
  )
}

function nodeToOp(node: ElementTreeNode): AnyOp {
  const el = node.element
  const needsBody = node.children.length > 0 || hasElementProps(el)

  const inline: AnyOp[] = [
    print(node.name),
    print('='),
    print(String(el.kind)),
  ]

  if (el.title) {
    inline.push(inlineText(el.title))
  }

  if (needsBody) {
    inline.push(body(
      withctx(el)(elementProperties()),
      ...node.children.map(child => nodeToOp(child)),
    ))
  }

  return spaceBetween(...inline)
}

// --- Relationship ---

function relationProperties(): Op<Relationship> {
  return lines(
    descriptionProperty(),
    summaryProperty(),
    technologyProperty(),
    printTags(),
    linksProperty(),
    metadataBlock(),
    enumProperty('color'),
    enumProperty('line'),
    enumProperty('head'),
    enumProperty('tail'),
    enumProperty('navigateTo'),
  )
}

function relToOp(rel: Relationship): AnyOp {
  const source = String(rel.source.model)
  const target = String(rel.target.model)
  const arrow = rel.kind ? `-[${String(rel.kind)}]->` : '->'

  const inline: AnyOp[] = [
    print(source),
    print(arrow),
    print(target),
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

export function printModel(
  elements: Record<string, Element>,
  relations: Record<string, Relationship>,
): AnyOp {
  const tree = buildTree(elements)
  const rels = Object.values(relations)

  return body('model')(
    ...tree.map(node => nodeToOp(node)),
    ...rels.map(rel => relToOp(rel)),
  )
}
