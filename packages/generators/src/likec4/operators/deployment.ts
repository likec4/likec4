import type { Fqn } from '@likec4/core/types'
import { invariant, nameFromFqn, parentFqn, sortParentsFirst } from '@likec4/core/utils'
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
  printProperty,
  property,
  select,
  spaceBetween,
  when,
  withctx,
  zodOp,
} from './base'
import { fqnRef } from './expressions'
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

type NodeData = schemas.deployment.node.Data
type InstanceData = schemas.deployment.instance.Data
type ElementData = schemas.deployment.element.Data

type TreeNodeData =
  | NodeData & {
    children: Array<TreeNodeData>
  }
  | InstanceData

function buildTree(elements: ElementData[]): {
  roots: readonly TreeNodeData[]
  nodes: ReadonlyMap<Fqn, TreeNodeData>
  exists: (fqn: Fqn) => boolean
} {
  const nodes = new Map<Fqn, TreeNodeData>()
  const roots: TreeNodeData[] = []
  const sorted = pipe(
    elements,
    sortParentsFirst,
  )

  for (const element of sorted) {
    let node: TreeNodeData
    if ('element' in element) {
      node = element
    } else {
      node = {
        ...element,
        children: [],
      }
    }
    nodes.set(element.id, node)

    const parentId = parentFqn(element.id)
    const parent = parentId ? nodes.get(parentId) : undefined

    if (parent && 'children' in parent) {
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

function hasStyleProps(el: NodeData | InstanceData): boolean {
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

const elementProperties = zodOp(schemas.deployment.element)(
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

export const instance = zodOp(schemas.deployment.instance)(
  spaceBetween(
    when(
      v => nameFromFqn(v.id) !== nameFromFqn(v.element),
      print(v => nameFromFqn(v.id)),
      print(' ='),
    ),
    print('instanceOf'),
    printProperty('element'),
    when(
      v => !!v.title && v.title !== nameFromFqn(v.id),
      property('title', inlineText()),
    ),
    when(
      e => hasElementProps(e),
      body(
        elementProperties(),
      ),
    ),
  ),
)

export function node() {
  return function nodeOp<E extends TreeNodeData>(
    { ctx, out }: Ctx<E>,
  ): Ctx<E> {
    const el = ctx

    if ('element' in el) {
      instance()({ ctx: el, out })
      return { ctx, out }
    }
    invariant('children' in el, 'Node must have children property')
    const needsBody = el.children.length > 0 || hasElementProps(el)

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
            ...el.children.map(node => withctx(node, nodeOp)),
          ),
        ),
      )
    }

    return spaceBetween(...inline)({ ctx, out })
  }
}

// --- Relationship ---

function hasRelationStyle(rel: schemas.deployment.relationship.Data): boolean {
  return !!(
    rel.color || rel.line || rel.head || rel.tail
  )
}

function hasRelationProps(rel: schemas.deployment.relationship.Data): boolean {
  return !!(
    rel.description || rel.summary || rel.technology
    || (rel.tags && rel.tags.length > 0)
    || (rel.links && rel.links.length > 0)
    || !isEmptyish(rel.metadata)
    || hasRelationStyle(rel)
    || rel.navigateTo
  )
}

export const relationship = zodOp(schemas.deployment.relationship)(
  spaceBetween(
    property('source', fqnRef()),
    print(rel => rel.kind ? `-[${rel.kind}]->` : '->'),
    property('target', fqnRef()),
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

// export const element = zodOp(schemas.model.element)(
//   elementTree(),
// )

// --- Main ---

export const deployment = zodOp(schemas.deployment.schema)(
  body('deployment')(
    lines(2)(
      select(
        d => buildTree(d.elements ? values(d.elements) : []).roots,
        lines(2)(
          foreach(
            node(),
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
