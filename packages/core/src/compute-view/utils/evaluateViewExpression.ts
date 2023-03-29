import type { Predicate } from 'rambdax'
import { anyPass, map, pluck, uniq } from 'rambdax'
import type { ModelIndex } from '../../model-index'
import type { Element, Fqn, Relation, Expression as RuleExpression } from '../../types'
import * as Expression from '../../types/expression'
import { failExpectedNever,isAncestor, RelationPredicates } from '../../utils'
import { elementsCartesian } from './elementsCartesian'

const { isBetween, isIncoming, isOutgoing } = RelationPredicates

const dropNested = (elements: Element[]) => {
  return elements.reduce<Element[]>((acc, current) => {
    if (acc.length === 0) return [current]
    // current is a child of some in acc
    if (acc.some(p => p.id === current.id || isAncestor(p, current))) {
      return acc
    }
    return [
      // drop children of current
      ...acc.filter(e => !isAncestor(current, e)),
      current
    ]
  }, [])
}

export const keepLeafs = (elements: Element[]) => {
  return elements.reduce<Element[]>((acc, current) => {
    if (acc.length === 0) return [current]
    // current is an ancestor of some in acc
    if (acc.some(p => p.id === current.id || isAncestor(current, p))) {
      return acc
    }
    return [
      // drop ancestors of current
      ...acc.filter(e => !isAncestor(e, current)),
      current
    ]
  }, [])
}

export const evaluateElementExpression = (index: ModelIndex, expr: Expression.ElementExpression, rootElement: Fqn | null = null) => {
  let elements = [] as Element[]
  let neighbours = [] as Element[]
  let relations = [] as Relation[]

  // const inOutRelations = (elements: Element[]) => {
  //   if (elements.length == 0) return []
  //   const filters = dropNested(elements).map(e => isAnyInOut(e.id))
  //   return index.filterRelations(anyPass(filters))
  // }

  const allRelationsBetween = (elements: Element[]) => {
    if (elements.length <= 1) return []
    const filters = [] as Predicate<Relation>[]
    for (const [source, target] of elementsCartesian(elements)) {
      filters.push(isBetween(source, target))
    }
    return filters.length ? index.filterRelations(anyPass(filters)) : []
  }

  // WildcardExpression
  if (Expression.isWildcard(expr)) {
    if (rootElement) {
      elements = [
        index.find(rootElement),
        ...index.children(rootElement)
      ]
      neighbours = [
        ...index.siblings(rootElement),
        ...index.ancestors(rootElement).flatMap(a => [
          ...index.siblings(a.id)
        ])
      ]
      relations = index.filterRelations(anyPass([
        isBetween(rootElement),
        isIncoming(rootElement),
        isOutgoing(rootElement),
      ]))
    } else {
      elements = index.rootElements()
      neighbours = elements
      relations = allRelationsBetween(elements)
    }
    return {
      elements,
      neighbours,
      relations
    }
  }


  // Identifier
  if (Expression.isElementRef(expr)) {
    elements = expr.isDescedants ? index.children(expr.element) : [index.find(expr.element)]
    if (expr.isDescedants) {
      relations = index.filterRelations(isBetween(expr.element))
      //   relations = index.filterRelations(anyPass([
      //     isBetween(expr.element),
      //     isIncoming(expr.element),
      //     isOutgoing(expr.element),
      //   ]))
      // } else {
      //   relations = index.filterRelations(anyPass([
      //     isIncoming(expr.element),
      //     isOutgoing(expr.element)
      //   ]))
    }
    return {
      elements,
      neighbours,
      relations
    }
  }


  failExpectedNever(expr)
}

interface EvaluateViewExpressionResult {
  elements: Element[]
  neighbours: Element[]
  relations: Relation[]
}

export const evaluateViewExpression = (index: ModelIndex, expr: RuleExpression, rootElement: Fqn | null): EvaluateViewExpressionResult => {
  const elements = [] as Element[]
  let neighbours = [] as Element[]
  let relations = [] as Relation[]

  if (Expression.isInOut(expr)) {
    const targets = evaluateElementExpression(index, expr.inout).elements
    for (const target of targets) {
      const incoming = index.filterRelations(isIncoming(target.id))
      const outgoing = index.filterRelations(isOutgoing(target.id))
      if (incoming.length + outgoing.length > 0) {
        elements.push(target)
        neighbours = neighbours.concat(
          map(index.find, [
            ...pluck('source', incoming),
            ...pluck('target', outgoing),
          ])
        )
        relations = relations.concat([
          ...incoming,
          ...outgoing
        ])
      }
    }
    return {
      elements: uniq(elements),
      neighbours: dropNested(neighbours),
      relations: uniq(relations)
    }
  }

  if (Expression.isIncoming(expr)) {
    const targets = evaluateElementExpression(index, expr.incoming).elements
    for (const target of targets) {
      const incoming = index.filterRelations(isIncoming(target.id))
      if (incoming.length > 0) {
        elements.push(target)
        neighbours = neighbours.concat(
          map(index.find, pluck('source', incoming))
        )
        relations = relations.concat(incoming)
      }
    }
    return {
      elements: uniq(elements),
      neighbours: dropNested(neighbours),
      relations: uniq(relations)
    }
  }

  if (Expression.isOutgoing(expr)) {
    const sources = evaluateElementExpression(index, expr.outgoing).elements
    for (const source of sources) {
      const outgoing = index.filterRelations(isOutgoing(source.id))
      if (outgoing.length > 0) {
        elements.push(source)
        neighbours = neighbours.concat(
          map(index.find, pluck('target', outgoing))
        )
        relations = relations.concat(outgoing)
      }
    }
    return {
      elements: uniq(elements),
      neighbours: dropNested(neighbours),
      relations: uniq(relations)
    }
  }

  if (Expression.isRelation(expr)) {
    const isSourceWildcard = Expression.isWildcard(expr.source)
    const isTargetWildcard = Expression.isWildcard(expr.target)
    if (isSourceWildcard && !isTargetWildcard) {
      return evaluateViewExpression(index, {
        incoming: expr.target
      }, rootElement)
    }
    if (!isSourceWildcard && isTargetWildcard) {
      return evaluateViewExpression(index, {
        outgoing: expr.source
      }, rootElement)
    }

    const sources = evaluateElementExpression(index, expr.source).elements
    const targets = evaluateElementExpression(index, expr.target).elements
    for (const source of sources) {
      for (const target of targets) {
        if (isAncestor(source.id, target.id) || isAncestor(target.id, source.id)) {
          continue
        }
        const foundRelations = index.filterRelations(isBetween(source.id, target.id))
        if (foundRelations.length > 0) {
          relations = relations.concat(foundRelations)
          neighbours.push(source, target)
        }
      }
    }
    return {
      elements,
      neighbours: uniq(neighbours),
      relations: uniq(relations)
    }
  }

  return evaluateElementExpression(index, expr, rootElement)
}
