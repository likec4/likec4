import {
  first,
  flatMap,
  hasAtLeast,
  isDeepEqual,
  isTruthy,
  map,
  only,
  pipe,
  reduce,
  unique,
} from 'remeda'
import type { ElementModel } from '../../model'
import { findConnection } from '../../model/connection/model'
import type { LikeC4Model } from '../../model/LikeC4Model'
import {
  type Any,
  type aux,
  type Color,
  type DynamicViewRule,
  type MarkdownOrString,
  type NonEmptyArray,
  type RelationshipLineType,
  type scalar,
  type Step,
  type ViewRuleGlobalStyle,
  exact,
  isViewRulePredicate,
  stepGuards,
} from '../../types'
import { compareRelations, isNonEmptyArray, nonexhaustive } from '../../utils'
import { elementExprToPredicate } from '../utils/elementExpressionToPredicate'

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

export const flattenSteps = <A extends Any>(s: Step.Any<A>): Step<A>[] => {
  switch (true) {
    case stepGuards.isStep(s): {
      return [s]
    }
    case stepGuards.isParallel(s): {
      // Parallel steps are flattened by taking the first step of each parallel step and the rest of the steps
      const heads = [] as Step<A>[]
      const tails = [] as Step<A>[]
      for (const nested of s.steps) {
        const [head, ...tail] = flattenSteps(nested)
        if (head) {
          heads.push(head)
        }
        tails.push(...tail)
      }
      return [...heads, ...tails]
    }
    case stepGuards.isSeries(s): {
      return [...s.steps]
    }
    case stepGuards.isLoop(s):
    case stepGuards.isOpt(s): {
      return flatMap(s.steps, flattenSteps)
    }
    case stepGuards.isTry(s): {
      return flatMap([
        ...s.try.steps,
        ...(s.catch?.steps ?? []),
        ...(s.finally?.steps ?? []),
      ], flattenSteps)
    }
    case stepGuards.isAlt(s): {
      return pipe(
        s.branches,
        flatMap((branch) => flatMap(branch.steps, flattenSteps)),
      )
    }
    default:
      nonexhaustive(s)
  }
}

export function elementsFromSteps<A extends Any>(
  model: LikeC4Model<A>,
  steps: Step.Any<A>[],
): Set<ElementModel<A>> {
  const actors = [] as Array<ElementModel<A>>

  const addActor = (...[source, target]: [ElementModel<A>, ElementModel<A>]) => {
    // source actor not yet added
    if (!actors.includes(source)) {
      const indexOfTarget = actors.indexOf(target)
      if (indexOfTarget > 0) {
        // place source before target
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
  technology?: string
  description?: MarkdownOrString
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
      kind: relation.kind ?? undefined,
      tags: relation.tags,
      relations: [relation.id],
      navigateTo: relation.$relationship.navigateTo,
      color: relation.$relationship.color,
      line: relation.$relationship.line,
      technology: relation.technology ?? undefined,
      description: relation.$relationship.description ?? undefined,
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
    reduce((acc, { title, technology, $relationship: r }) => {
      isTruthy(title) && acc.title.add(title)
      isTruthy(r.color) && acc.color.add(r.color)
      isTruthy(r.line) && acc.line.add(r.line)
      isTruthy(r.kind) && acc.kind.add(r.kind)
      isTruthy(technology) && acc.technology.add(technology)
      if (isTruthy(r.description) && !acc.description.some(isDeepEqual(r.description))) {
        acc.description.push(r.description)
      }
      return acc
    }, {
      kind: new Set<aux.RelationKind<A>>(),
      color: new Set<Color>(),
      line: new Set<RelationshipLineType>(),
      title: new Set<string>(),
      technology: new Set<string>(),
      description: [] as MarkdownOrString[],
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
    technology: only([...commonProperties.technology]),
    description: only(commonProperties.description),
  })
}

/**
 * Returns the ids of all ancestor subflows that enclose the given step path,
 * ordered from the outermost flow to the innermost (closest) one.
 *
 * A {@link scalar.StepPath} is a `.`-joined chain of segments where every
 * subflow segment carries a `NN:type` suffix (e.g. `02:opt`, `03:try`,
 * `01:block`), while a plain step segment is just its number (`NN`). Every
 * prefix that ends in such a `:`-bearing segment is therefore an ancestor flow.
 *
 * The path itself is never included — a flow is not its own ancestor — so
 * passing a flow id returns only the flows above it.
 *
 * @example
 * flowAncestors('step-01.02:opt.03:try.04' as StepPath)
 * // => ['step-01.02:opt', 'step-01.02:opt.03:try']
 */
export function flowAncestors(path: scalar.EdgeId | scalar.StepPath): scalar.StepPath[] {
  const segments = path.split('.')
  const ancestors: scalar.StepPath[] = []
  const prefix: string[] = []
  // Skip the last segment: it is the path itself, not an ancestor.
  for (const segment of segments.slice(0, -1)) {
    prefix.push(segment)
    if (segment.includes(':')) {
      ancestors.push(prefix.join('.') as scalar.StepPath)
    }
  }
  return ancestors
}
