import { first, flatMap, hasAtLeast, isTruthy, map, only, pipe, reduce, unique } from 'remeda'
import type { ElementModel } from '../../model'
import { findConnection } from '../../model/connection/model'
import type { LikeC4Model } from '../../model/LikeC4Model'
import {
  type Any,
  type aux,
  type Color,
  type DynamicStep,
  type DynamicViewRule,
  type DynamicViewStep,
  type NonEmptyArray,
  type RelationshipLineType,
  type ViewRuleGlobalStyle,
  exact,
  isDynamicBranchCollection,
  isDynamicStep,
  isDynamicStepsSeries,
  isViewRulePredicate,
  toLegacyParallel,
} from '../../types'
import { compareRelations, isNonEmptyArray } from '../../utils'
import { elementExprToPredicate } from '../utils/elementExpressionToPredicate'

/**
 * Collects element models explicitly referenced by `include` expressions in the provided resolved rules.
 *
 * @param model - The model to search for elements
 * @param resolvedRules - Resolved dynamic view rules whose `include` expressions will be evaluated
 * @returns A `Set` of `ElementModel<A>` that match any `include` expression from `resolvedRules`
 */
export function elementsFromIncludeProperties<A extends Any>(
  model: LikeC4Model<A>,
  resolvedRules: Array<Exclude<DynamicViewRule<A>, ViewRuleGlobalStyle>>,
): Set<ElementModel<A>> {
  const explicits = new Set<ElementModel<A>>()
  for (const rule of resolvedRules) {
    if (isViewRulePredicate(rule)) {
      for (const expr of rule.include) {
        const satisfies = elementExprToPredicate(expr)
        for (const e of model.elements()) {
          if (satisfies(e)) {
            explicits.add(e)
          }
        }
      }
    }
  }
  return explicits
}

export const flattenSteps = <A extends Any>(s: DynamicViewStep<A>): DynamicStep<A>[] => {
  const legacyParallel = toLegacyParallel(s)
  if (legacyParallel) {
    // Parallel steps are flattened by taking the first step of each parallel step and the rest of the steps
    const heads = [] as DynamicStep<A>[]
    const tails = [] as DynamicStep<A>[]
    for (const step of legacyParallel.__parallel ?? []) {
      if (isDynamicStepsSeries(step)) {
        const [head, ...tail] = step.__series
        heads.push(head)
        tails.push(...tail)
      } else {
        heads.push(step)
      }
    }
    return [...heads, ...tails]
  }
  if (isDynamicBranchCollection(s)) {
    return flatMap(s.paths, path => flatMap(path.steps, entry => flattenSteps(entry as DynamicViewStep<A>)))
  }
  if (isDynamicStepsSeries(s)) {
    return [...s.__series]
  }
  return isDynamicStep(s) ? [s] : []
}

/**
 * Compute the ordered set of element models referenced by a sequence of dynamic view steps.
 *
 * Iterates the flattened steps left-to-right, resolves each step's source and target from the model,
 * and accumulates elements in an order that preserves actor ordering implied by the steps and backward links.
 *
 * @param model - Model used to resolve element identifiers from each step
 * @param steps - Dynamic view steps to inspect (may contain series, branches, or legacy parallel structures)
 * @returns A Set of ElementModel objects containing all elements referenced by the steps in processing order
 */
export function elementsFromSteps<A extends Any>(
  model: LikeC4Model<A>,
  steps: DynamicViewStep<A>[],
): Set<ElementModel<A>> {
  const actors = [] as Array<ElementModel<A>>

  const addActor = (...[source, target]: [ElementModel<A>, ElementModel<A>]) => {
    // source actor not yet added
    if (!actors.includes(source)) {
      const indexOfTarget = actors.indexOf(target)
      if (indexOfTarget > 0) {
        actors.splice(indexOfTarget, 0, source)
        return
      } else {
        actors.push(source)
      }
    }
    if (!actors.includes(target)) {
      actors.push(target)
    }
  }

  for (const step of flatMap(steps, flattenSteps)) {
    const source = model.element(step.source)
    const target = model.element(step.target)

    let sourceColumn = actors.indexOf(source)
    let targetColumn = actors.indexOf(target)

    const alreadyAdded = sourceColumn >= 0 && targetColumn >= 0
    if (alreadyAdded) {
      continue
    }

    if (step.isBackward) {
      addActor(target, source)
    } else {
      addActor(source, target)
    }
  }

  return new Set(actors)
}

export function findRelations<A extends Any>(
  source: ElementModel<A>,
  target: ElementModel<A>,
  currentViewId: aux.StrictViewId<A>,
): {
  title?: string
  kind?: aux.RelationKind<A>
  tags?: aux.Tags<A>
  relations?: NonEmptyArray<aux.RelationId>
  navigateTo?: aux.StrictViewId<A>
  color?: Color
  line?: RelationshipLineType
} {
  const relationships = findConnection(source, target, 'directed')
    .flatMap(r => [...r.relations])
    .sort(compareRelations)
  if (!isNonEmptyArray(relationships)) {
    return {}
  }
  if (relationships.length === 1) {
    const relation = relationships[0]
    return exact({
      title: relation.title ?? undefined,
      tags: relation.tags,
      relations: [relation.id],
      navigateTo: relation.$relationship.navigateTo,
      color: relation.$relationship.color,
      line: relation.$relationship.line,
    })
  }
  const alltags = pipe(
    relationships,
    flatMap(r => r.tags),
    unique(),
  ) as aux.Tags<A>
  const tags = hasAtLeast(alltags, 1) ? alltags : undefined
  const relations = map(relationships, r => r.id)

  // Most closest relation
  const relation = first(relationships)
  let navigateTo = relation.$relationship.navigateTo
  if (navigateTo === currentViewId) {
    navigateTo = undefined
  }
  if (!navigateTo) {
    navigateTo = pipe(
      relationships,
      flatMap(r =>
        r.$relationship.navigateTo && r.$relationship.navigateTo !== currentViewId ? r.$relationship.navigateTo : []
      ),
      unique(),
      only(),
    )
  }

  const commonProperties = pipe(
    relationships,
    reduce((acc, { title, $relationship: r }) => {
      isTruthy(title) && acc.title.add(title)
      isTruthy(r.color) && acc.color.add(r.color)
      isTruthy(r.line) && acc.line.add(r.line)
      isTruthy(r.kind) && acc.kind.add(r.kind)
      return acc
    }, {
      kind: new Set<aux.RelationKind<A>>(),
      color: new Set<Color>(),
      line: new Set<RelationshipLineType>(),
      title: new Set<string>(),
    }),
  )

  return exact({
    tags: tags ?? undefined,
    relations,
    navigateTo,
    kind: only([...commonProperties.kind]),
    title: only([...commonProperties.title]),
    color: only([...commonProperties.color]),
    line: only([...commonProperties.line]),
  })
}