import { isDeepEqual, isNullish, isTruthy, only, pick, pickBy, pipe, reduce, unique } from 'remeda'
import {
  type AnyAux,
  type aux,
  type Color,
  type DeploymentRelationship,
  type NonEmptyArray,
  type Relationship,
  type RelationshipArrowType,
  type RelationshipLineType,
  type scalar,
  exact,
} from '../../types'
import { isNonEmptyArray } from '../../utils'

function pickRelationshipProps<A extends AnyAux>(relation: Relationship<A> | DeploymentRelationship<A>): {
  title?: string
  description?: scalar.MarkdownOrString | null
  technology?: string | null | undefined
  kind?: aux.RelationKind<A> | undefined
  color?: Color | undefined
  line?: RelationshipLineType | undefined
  head?: RelationshipArrowType | undefined
  tail?: RelationshipArrowType | undefined
  navigateTo?: aux.StrictViewId<A> | undefined
} {
  const {
    title,
    description = null,
  } = relation
  return {
    // Pick description only if title is present
    ...(title && {
      title,
      description,
    }),
    ...pick(relation, ['color', 'technology', 'head', 'line', 'tail', 'kind', 'navigateTo']),
  }
}

export type MergedRelationshipProps<A extends AnyAux> = {
  title?: string | null
  description?: scalar.MarkdownOrString | null
  technology?: string
  kind?: aux.RelationKind<A>
  color?: Color
  line?: RelationshipLineType
  head?: RelationshipArrowType
  tail?: RelationshipArrowType
  navigateTo?: aux.StrictViewId<A>
  tags?: NonEmptyArray<aux.Tag<A>>
}

/**
 * Merges properties from multiple relationships into a single object.
 * @param relations - The relationships to merge.
 * @param prefer - The relationship to prefer when merging.
 */
export function mergePropsFromRelationships<A extends AnyAux>(
  relations: Array<Relationship<A> | DeploymentRelationship<A>>,
  prefer?: Relationship<A> | DeploymentRelationship<A>,
): MergedRelationshipProps<A> {
  const allprops = pipe(
    relations,
    reduce(
      (acc, r) => {
        if (isTruthy(r.title) && !acc.title.includes(r.title)) {
          acc.title.push(r.title)
        }
        if (isTruthy(r.description) && !acc.description.some(isDeepEqual(r.description))) {
          acc.description.push(r.description)
        }
        if (isTruthy(r.technology) && !acc.technology.includes(r.technology)) {
          acc.technology.push(r.technology)
        }
        if (isTruthy(r.kind) && !acc.kind.includes(r.kind)) {
          acc.kind.push(r.kind)
        }
        if (isTruthy(r.color) && !acc.color.includes(r.color)) {
          acc.color.push(r.color)
        }
        if (isTruthy(r.line) && !acc.line.includes(r.line)) {
          acc.line.push(r.line)
        }
        if (isTruthy(r.head) && !acc.head.includes(r.head)) {
          acc.head.push(r.head)
        }
        if (isTruthy(r.tail) && !acc.tail.includes(r.tail)) {
          acc.tail.push(r.tail)
        }
        if (isTruthy(r.navigateTo) && !acc.navigateTo.includes(r.navigateTo as aux.StrictViewId<A>)) {
          acc.navigateTo.push(r.navigateTo as aux.StrictViewId<A>)
        }
        if (r.tags) {
          acc.tags.push(...r.tags)
        }
        return acc
      },
      {
        title: [] as string[],
        description: [] as scalar.MarkdownOrString[],
        technology: [] as string[],
        kind: [] as aux.RelationKind<A>[],
        head: [] as RelationshipArrowType[],
        tail: [] as RelationshipArrowType[],
        color: [] as Color[],
        tags: [] as aux.Tag<A>[],
        line: [] as RelationshipLineType[],
        navigateTo: [] as aux.StrictViewId<A>[],
      },
    ),
  )

  let title = only(allprops.title) ?? (allprops.title.length > 1 ? '[...]' : undefined)

  const tags = unique(allprops.tags)
  let merged: MergedRelationshipProps<A> = exact({
    title,
    description: only(allprops.description),
    technology: only(allprops.technology),
    kind: only(allprops.kind),
    head: only(allprops.head),
    tail: only(allprops.tail),
    color: only(allprops.color),
    line: only(allprops.line),
    navigateTo: only(allprops.navigateTo),
    ...isNonEmptyArray(tags) && { tags },
  })

  if (prefer) {
    const preferred = pickRelationshipProps(prefer)
    merged = pickBy({
      ...merged,
      ...preferred,
    }, isTruthy)
  }

  // If after merging title is still null, but technology is present, set title to technology
  if (isNullish(merged.title) && isTruthy(merged.technology)) {
    merged.title = `[${merged.technology}]`
    delete merged.technology
  }
  return merged
}
