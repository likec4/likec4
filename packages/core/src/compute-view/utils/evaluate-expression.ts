import type { Predicate } from 'rambdax'
import { anyPass, map, pluck, uniq } from 'rambdax'
import type { ModelIndex } from '../../model-index'
import type { Element, Fqn, Relation, Expression } from '../../types'
import * as Expr from '../../types/expression'
import { failExpectedNever, isAncestor } from '../../utils'
import { isBetween, isIncoming, isInside, isOutgoing } from '../../utils/relations'
import { anyPossibleRelations } from './anyPossibleRelations'

const dropNested = (elements: Element[]) => {
  return elements.reduce<Element[]>((acc, current) => {
    if (acc.length === 0) return [current]
    // current is a child   of some in acc
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

const evaluateElementExpression = (
  index: ModelIndex,
  expr: Expr.ElementExpression,
  rootElement: Fqn | null = null
) => {
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
    for (const [source, target] of anyPossibleRelations(elements)) {
      filters.push(isBetween(source.id, target.id))
    }
    return filters.length ? index.filterRelations(anyPass(filters)) : []
  }

  // WildcardExpression
  if (Expr.isWildcard(expr)) {
    if (rootElement) {
      elements = [index.find(rootElement), ...index.children(rootElement)]
      neighbours = [
        ...index.siblings(rootElement),
        ...index.ancestors(rootElement).flatMap(a => [...index.siblings(a.id)])
      ]
      relations = index.filterRelations(
        anyPass([isInside(rootElement), isIncoming(rootElement), isOutgoing(rootElement)])
      )
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
  if (Expr.isElementRef(expr)) {
    elements = expr.isDescedants ? index.children(expr.element) : [index.find(expr.element)]
    if (expr.isDescedants) {
      relations = index.filterRelations(isInside(expr.element))
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

export function evaluateExpression(
  index: ModelIndex,
  expr: Expression,
  rootElement: Fqn | null
): EvaluateViewExpressionResult {
  const elements = [] as Element[]
  let neighbours = [] as Element[]
  let relations = [] as Relation[]

  if (Expr.isInOut(expr)) {
    const targets = evaluateElementExpression(index, expr.inout).elements
    for (const target of targets) {
      const incoming = index.filterRelations(isIncoming(target.id))
      const outgoing = index.filterRelations(isOutgoing(target.id))
      if (incoming.length + outgoing.length > 0) {
        elements.push(target)
        neighbours = neighbours.concat(
          map(index.find, [...pluck('source', incoming), ...pluck('target', outgoing)])
        )
        relations = relations.concat([...incoming, ...outgoing])
      }
    }
    return {
      elements: uniq(elements),
      neighbours: dropNested(neighbours),
      relations: uniq(relations)
    }
  }

  if (Expr.isIncoming(expr)) {
    const targets = evaluateElementExpression(index, expr.incoming).elements
    for (const target of targets) {
      const incoming = index.filterRelations(isIncoming(target.id))
      if (incoming.length > 0) {
        elements.push(target)
        neighbours = neighbours.concat(map(index.find, pluck('source', incoming)))
        relations = relations.concat(incoming)
      }
    }
    return {
      elements: uniq(elements),
      neighbours: dropNested(neighbours),
      relations: uniq(relations)
    }
  }

  if (Expr.isOutgoing(expr)) {
    const sources = evaluateElementExpression(index, expr.outgoing).elements
    for (const source of sources) {
      const outgoing = index.filterRelations(isOutgoing(source.id))
      if (outgoing.length > 0) {
        elements.push(source)
        neighbours = neighbours.concat(map(index.find, pluck('target', outgoing)))
        relations = relations.concat(outgoing)
      }
    }
    return {
      elements: uniq(elements),
      neighbours: dropNested(neighbours),
      relations: uniq(relations)
    }
  }

  if (Expr.isRelation(expr)) {
    const isSourceWildcard = Expr.isWildcard(expr.source)
    const isTargetWildcard = Expr.isWildcard(expr.target)
    if (isSourceWildcard && !isTargetWildcard) {
      return evaluateExpression(
        index,
        {
          incoming: expr.target
        },
        rootElement
      )
    }
    if (!isSourceWildcard && isTargetWildcard) {
      return evaluateExpression(
        index,
        {
          outgoing: expr.source
        },
        rootElement
      )
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
