import { isDeepEqual, isTruthy, only, pickBy, pipe, reduce, unique } from 'remeda'
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
  technology: string | null
  kind: aux.RelationKind<A> | null
  color: Color | null
  line: RelationshipLineType | null
  head: RelationshipArrowType | null
  tail: RelationshipArrowType | null
  navigateTo: aux.StrictViewId<A> | null
} {
  const {
    title,
    description = null,
    technology = null,
    kind = null,
    color = null,
    line = null,
    head = null,
    tail = null,
    navigateTo = null,
  } = relation
  return {
    // Pick description only if title is present
    ...(title && {
      title,
      description,
    }),
    technology,
    kind: kind as aux.RelationKind<A> | null,
    color,
    line,
    head,
    tail,
    navigateTo: navigateTo as aux.StrictViewId<A> | null,
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

  let technology = only(allprops.technology)
  let title = only(allprops.title) ?? (allprops.title.length > 1 ? '[...]' : null)

  const tags = unique(allprops.tags)
  let merged: MergedRelationshipProps<A> = exact({
    // If there is no title, but there is technology, use technology as title
    title: title ?? (technology ? `[${technology}]` : null),
    description: only(allprops.description),
    technology,
    kind: only(allprops.kind),
    head: only(allprops.head),
    tail: only(allprops.tail),
    color: only(allprops.color),
    line: only(allprops.line),
    navigateTo: only(allprops.navigateTo),
    ...isNonEmptyArray(tags) && { tags },
  })

  if (prefer) {
    return {
      ...merged,
      ...pickBy(pickRelationshipProps(prefer), isTruthy),
    }
  }
  return merged
}
