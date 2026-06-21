import { first, flatMap, hasAtLeast, isDeepEqual, isTruthy, map, only, pipe, reduce, unique } from 'remeda'
import type { ElementModel } from '../../model'
import { findConnection } from '../../model/connection/model'
import type { LikeC4Model } from '../../model/LikeC4Model'
import {
  type Any,
  type aux,
  type Color,
  type DynamicStep,
  type DynamicViewElement,
  type DynamicViewRule,
  type DynamicViewStep,
  type MarkdownOrString,
  type NonEmptyArray,
  type RelationshipLineType,
  type ViewRuleGlobalStyle,
  exact,
  isDynamicActivate,
  isDynamicBreakBlock,
  isDynamicCreate,
  isDynamicCriticalBlock,
  isDynamicDeactivate,
  isDynamicDestroy,
  isDynamicGroupBlock,
  isDynamicIfBlock,
  isDynamicNote,
  isDynamicOptionalBlock,
  isDynamicRepeatBlock,
  isDynamicStep,
  isDynamicStepsParallel,
  isDynamicStepsSeries,
  isViewRulePredicate,
} from '../../types'
import { compareRelations, isNonEmptyArray } from '../../utils'
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

/**
 * Recursively extract all DynamicStep leaves from new block/marker element types.
 * Used by elementsFromSteps to gather all actors referenced inside frames and markers.
 */
function flattenNewElement<A extends Any>(element: DynamicViewElement<A>): DynamicStep<A>[] {
  const steps: DynamicStep<A>[] = []

  const collectBody = (elements: DynamicViewElement<A>[]): void => {
    for (const el of elements) {
      const result = flattenSteps(el)
      if (Array.isArray(result)) {
        steps.push(...result)
      } else {
        steps.push(result)
      }
    }
  }

  switch (true) {
    case isDynamicIfBlock(element): {
      collectBody([...element.thenBranch.elements])
      for (const ei of element.elseIfs) collectBody([...ei.body.elements])
      if (element.else) collectBody([...element.else.elements])
      break
    }
    case isDynamicOptionalBlock(element): {
      collectBody([...element.body.elements])
      break
    }
    case isDynamicRepeatBlock(element): {
      collectBody([...element.body.elements])
      break
    }
    case isDynamicGroupBlock(element): {
      collectBody([...element.body.elements])
      break
    }
    case isDynamicCriticalBlock(element): {
      collectBody([...element.body.elements])
      for (const fb of element.fallbacks) collectBody([...fb.body.elements])
      break
    }
    case isDynamicBreakBlock(element): {
      collectBody([...element.body.elements])
      break
    }
    // Markers (note/activate/deactivate/create/destroy) have no steps inside them
    case isDynamicNote(element):
    case isDynamicActivate(element):
    case isDynamicDeactivate(element):
    case isDynamicCreate(element):
    case isDynamicDestroy(element):
      break
  }

  return steps
}

export const flattenSteps = <A extends Any>(
  s: DynamicViewElement<A> | DynamicViewStep<A>,
): DynamicStep<A> | DynamicStep<A>[] => {
  if (isDynamicStepsParallel(s)) {
    // Parallel steps are flattened by taking the first step of each parallel step and the rest of the steps
    const heads = [] as DynamicStep<A>[]
    const tails = [] as DynamicStep<A>[]
    for (const step of s.__parallel) {
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
  if (isDynamicStepsSeries(s)) {
    return [...s.__series]
  }
  if (isDynamicStep(s)) {
    return s
  }
  // For new block/marker elements, recurse to extract all nested steps
  return flattenNewElement(s as DynamicViewElement<A>)
}

export function elementsFromSteps<A extends Any>(
  model: LikeC4Model<A>,
  steps: ReadonlyArray<DynamicViewElement<A> | DynamicViewStep<A>>,
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

  const addSingleActor = (fqn: aux.StrictFqn<A>): void => {
    const el = model.element(fqn)
    if (!actors.includes(el)) {
      actors.push(el)
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

  // Also add actors referenced in markers (note/activate/deactivate/create/destroy)
  // These are gathered by walking the element tree directly.
  const collectMarkerActors = (elements: ReadonlyArray<DynamicViewElement<A> | DynamicViewStep<A>>): void => {
    for (const el of elements) {
      switch (true) {
        case isDynamicNote(el): {
          for (const fqn of el.actors) addSingleActor(fqn)
          break
        }
        case isDynamicActivate(el): {
          addSingleActor(el.actor)
          break
        }
        case isDynamicDeactivate(el): {
          addSingleActor(el.actor)
          break
        }
        case isDynamicCreate(el): {
          addSingleActor(el.actor)
          break
        }
        case isDynamicDestroy(el): {
          addSingleActor(el.actor)
          break
        }
        case isDynamicIfBlock(el): {
          collectMarkerActors(el.thenBranch.elements)
          for (const ei of el.elseIfs) collectMarkerActors(ei.body.elements)
          if (el.else) collectMarkerActors(el.else.elements)
          break
        }
        case isDynamicOptionalBlock(el): {
          collectMarkerActors(el.body.elements)
          break
        }
        case isDynamicRepeatBlock(el): {
          collectMarkerActors(el.body.elements)
          break
        }
        case isDynamicGroupBlock(el): {
          collectMarkerActors(el.body.elements)
          break
        }
        case isDynamicCriticalBlock(el): {
          collectMarkerActors(el.body.elements)
          for (const fb of el.fallbacks) collectMarkerActors(fb.body.elements)
          break
        }
        case isDynamicBreakBlock(el): {
          collectMarkerActors(el.body.elements)
          break
        }
        case isDynamicStepsParallel(el): {
          if (el.branches) {
            for (const branch of el.branches) collectMarkerActors(branch.elements)
          }
          break
        }
        default:
          break
      }
    }
  }

  collectMarkerActors(steps)

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
