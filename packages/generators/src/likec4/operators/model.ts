import type { Fqn } from '@likec4/core/types'
import { nameFromFqn, parentFqn, sortParentsFirst } from '@likec4/core/utils'
import { isEmptyish, pipe, values } from 'remeda'

import { schemas } from '../schemas'
import {
  type AnyOp,
  type Ctx,
  body,
  foreach,
  inlineText,
  lines,
  print,
  property,
  select,
  spaceBetween,
  when,
  withctx,
  zodOp,
} from './base'
import {
  colorProperty,
  descriptionProperty,
  linksProperty,
  metadataProperty,
  styleProperties,
  summaryProperty,
  tagsProperty,
  technologyProperty,
} from './properties'

// --- Tree building ---

type ElementData = schemas.model.element.Data

type ElementTreeNode = ElementData & {
  children?: ElementTreeNode[]
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
    const node: ElementTreeNode = { ...element, children: [] }
    nodes.set(element.id, node)

    const parentId = parentFqn(element.id)
    const parent = parentId ? nodes.get(parentId) : undefined

    if (parent) {
      parent.children!.push(node)
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

const elementProperties = zodOp(schemas.model.element)(
  lines(
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
  ),
)

export function elementTree() {
  return function elementTreeNodeOp<E extends ElementTreeNode>(
    { ctx, out }: Ctx<E>,
  ): Ctx<E> {
    const el = ctx
    const needsBody = (ctx.children?.length ?? 0) > 0 || hasElementProps(el)

    const name = nameFromFqn(el.id)

    const inline: AnyOp[] = [
      print(name),
      print('='),
      print(el.kind),
    ]

    if (el.title && el.title !== name) {
      inline.push(inlineText(el.title))
    }

    if (needsBody) {
      inline.push(
        body(
          lines(2)(
            withctx(el, elementProperties()),
            ...(ctx.children ?? []).map(node => withctx(node, elementTree())),
          ),
        ),
      )
    }

    return spaceBetween(...inline)({ ctx, out })
  }
}

// --- Relationship ---

function hasRelationStyle(rel: schemas.model.relationship.Data): boolean {
  return !!(
    rel.color || rel.line || rel.head || rel.tail
  )
}

function hasRelationProps(rel: schemas.model.relationship.Data): boolean {
  return !!(
    rel.description || rel.summary || rel.technology
    || (rel.tags && rel.tags.length > 0)
    || (rel.links && rel.links.length > 0)
    || !isEmptyish(rel.metadata)
    || hasRelationStyle(rel)
    || rel.navigateTo
  )
}

export const relationship = zodOp(schemas.model.relationship)(
  spaceBetween(
    print(rel => rel.source.model),
    print(rel => rel.kind ? `-[${rel.kind}]->` : '->'),
    print(rel => rel.target.model),
    property(
      'title',
      inlineText(),
    ),
    when(
      hasRelationProps,
      body(
        tagsProperty(),
        technologyProperty(),
        summaryProperty(),
        descriptionProperty(),
        property('navigateTo'),
        linksProperty(),
        metadataProperty(),
        when(
          hasRelationStyle,
          body('style')(
            colorProperty(),
            property('line'),
            property('head'),
            property('tail'),
          ),
        ),
      ),
    ),
  ),
)

export const element = zodOp(schemas.model.element)(
  elementTree(),
)

// --- Main ---

export const model = zodOp(schemas.model.schema)(
  body('model')(
    lines(2)(
      select(
        d => buildTree(d.elements ? values(d.elements) : []).roots,
        lines(2)(
          foreach(
            elementTree(),
          ),
        ),
      ),
      select(
        d => d.relations ? values(d.relations) : undefined,
        lines(2)(
          foreach(
            relationship(),
          ),
        ),
      ),
    ),
  ),
)
