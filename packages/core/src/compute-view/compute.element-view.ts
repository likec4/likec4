import { anyPass, filter, type Predicate } from 'rambdax'
import type { ModelIndex } from '../model-index'
import { DefaultElementShape, DefaultThemeColor, type Element, type ElementView, type Relation, type ViewRuleStyle } from '../types'
import { isViewRuleExpression, isViewRuleStyle } from '../types/view'
import * as Expression from '../types/expression'
import { compareByFqnHierarchically, failExpectedNever, isSameHierarchy, parentFqn, Relations } from '../utils'
import { EdgeBuilder } from './EdgeBuilder'
import type { ComputedEdge, ComputedNode, ComputedView } from '../types/computed-view'
import { anyPossibleRelations } from './utils/anyPossibleRelations'
import { evaluateExpression } from './utils/evaluate-expression'
import { sortNodes } from './utils/sortNodes'

function updateSetWith<T>(set: Set<T>, elements: T[], addToSet = true): void {
  for (const e of elements) {
    addToSet ? set.add(e) : set.delete(e)
  }
}
function computeNodes(elements: Element[], index: ModelIndex) {
  const ids = new Set(elements.map(e => e.id))
  return elements.map(({ id, title, color, shape, description }): ComputedNode => {
    let parent = parentFqn(id)
    while (parent) {
      if (ids.has(parent)) {
        break
      }
      parent = parentFqn(parent)
    }
    const navigateTo = index.defaultViewOf(id)
    return Object.assign(
      {
        id,
        parent,
        title,
        color: color ?? DefaultThemeColor,
        shape: shape ?? DefaultElementShape,
        children: [],
      },
      description ? { description } : {},
      navigateTo ? { navigateTo } : {},
    )
  })
}

function applyViewRuleStyles(rules: ViewRuleStyle[], nodes: ComputedNode[]) {
  for (const rule of rules) {
    const predicates = [] as Predicate<ComputedNode>[]
    if (!rule.style.color && !rule.style.shape) {
      // skip empty
      continue
    }
    for (const target of rule.targets) {
      if (Expression.isElementRef(target)) {
        const { element, isDescedants } = target
        predicates.push(isDescedants
          ? (n) => n.id.startsWith(element + '.')
          : (n) => n.id as string === element
        )
        continue
      }
      if (Expression.isWildcard(target)) {
        predicates.push(() => true)
        continue
      }
      failExpectedNever(target)
    }
    filter(anyPass(predicates), nodes).forEach(n => {
      n.shape = rule.style.shape ?? n.shape
      n.color = rule.style.color ?? n.color
    })
  }

  return nodes
}


export function computeElementView(view: ElementView, index: ModelIndex): ComputedView {
  const relations = new Set<Relation>()
  const elements = new Set<Element>()
  const neighbours = new Set<Element>()

  const rootElement = view.viewOf ?? null
  const rulesInclude = view.rules.filter(isViewRuleExpression)
  if (rootElement && rulesInclude.length == 0) {
    elements.add(index.find(rootElement))
  }
  for (const { isInclude, exprs } of rulesInclude) {
    for (const expr of exprs) {
      let {
        elements: newElements,
        neighbours: newNeighbours,
        relations: newRelations
      } = evaluateExpression(index, expr, rootElement)

      if (isInclude) {
        const filters = [] as Predicate<Relation>[]
        // When include element(s) without newNeighbours, include in-out relations
        if (elements.size > 0 && newElements.length > 0 && newNeighbours.length === 0 && Expression.isElement(expr)) {
          for (const e of elements) {
            for (const newE of newElements) {
              if (!isSameHierarchy(e, newE)) {
                filters.push(Relations.isAnyBetween(e.id, newE.id))
              }
            }
          }
        }
        // // When include elements by tag or kind, include in-out relations
        // if (elements.size > 0 && newElements.length > 0 && (Expression.isElementKind(expr) || Expression.isElementTag(expr))) {
        //   for (const e of elements) {
        //     for (const newE of newElements) {
        //       if (e.id !== newE.id && !isAncestor(e, newE) && !isAncestor(newE, e)) {
        //         filters.push(isAnyRelationBetween(e.id, newE.id))
        //       }
        //     }
        //   }
        // }
        if (filters.length > 0) {
          newRelations = newRelations.concat(
            index.filterRelations(anyPass(filters))
          )
        }
      } else {
        if (Expression.isAnyRelation(expr)) {
          // Exclude only relations, but not elements and neighbours
          newNeighbours = []
          newElements = []
        } else {
          newNeighbours = newNeighbours.concat(newElements)
          // Also exclude nested elements from current neighbours
          // for (const n of neighbours) {
          //   if (newNeighbours.some(e => n.id.startsWith(e.id + '.'))) {
          //     newNeighbours.push(n)
          //   }
          // }
          // Do not exclude relations
          newRelations = []
        }
      }
      updateSetWith(elements, newElements, isInclude)
      updateSetWith(relations, newRelations, isInclude)
      updateSetWith(neighbours, newNeighbours, isInclude)
    }
  }


  const elementsIds = new Set([...elements].map(e => e.id))

  const edgeBuilder = new EdgeBuilder()
  const resolvedRelations = [...relations]

  for (const [source, target] of anyPossibleRelations([...elements, ...neighbours])) {
    if (!elementsIds.has(source.id) && !elementsIds.has(target.id)) {
      continue
    }
    const findPredicate = Relations.isBetween(source.id, target.id)
    let idx = resolvedRelations.findIndex(findPredicate)
    while (idx >= 0) {
      const [rel] = resolvedRelations.splice(idx, 1)
      if (rel) {
        elements.add(source)
        elements.add(target)
        edgeBuilder.add(source.id, target.id, rel)
      }
      idx = resolvedRelations.findIndex(findPredicate)
    }
  }

  const nodeIds = new Set([...elements].map(n => n.id))
  const edges = edgeBuilder.build().map(edge => {
    while (edge.parent) {
      if (nodeIds.has(edge.parent)) {
        break
      }
      edge.parent = parentFqn(edge.parent)
    }
    return edge
  })

  const nodes = applyViewRuleStyles(
    view.rules.filter(isViewRuleStyle),
    computeNodes([...elements].sort(compareByFqnHierarchically), index)
  ).sort(
    sortNodes(edges)
  )

  for (const n of nodes) {
    n.children = nodes.flatMap(child => child.parent === n.id ? child.id : [])
  }

  return {
    ...view,
    nodes,
    edges
  }
}
