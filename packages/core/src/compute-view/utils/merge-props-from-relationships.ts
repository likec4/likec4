import { isTruthy, only, pickBy, pipe, reduce, unique } from 'remeda'
import type {
  AnyAux,
  Color,
  DeploymentRelationship,
  Link,
  NonEmptyArray,
  Relationship,
  RelationshipArrowType,
  RelationshipLineType,
} from '../../types'
import { isNonEmptyArray } from '../../utils'

function pickRelationshipProps<A extends AnyAux>(relation: Relationship<A> | DeploymentRelationship<A>): {
  title?: string
  description?: string | null
  technology: string | null
  kind: Aux.RelationKind<A> | null
  color: Color | null
  line: RelationshipLineType | null
  head: RelationshipArrowType | null
  tail: RelationshipArrowType | null
  navigateTo: Aux.StrictViewId<A> | null
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
    kind: kind as Aux.RelationKind<A> | null,
    color,
    line,
    head,
    tail,
    navigateTo: navigateTo as Aux.StrictViewId<A> | null,
  }
}

export type MergedRelationshipProps<A extends AnyAux> = {
  title?: string | null
  description?: string
  technology?: string
  kind?: Aux.RelationKind<A>
  color?: Color
  line?: RelationshipLineType
  head?: RelationshipArrowType
  tail?: RelationshipArrowType
  navigateTo?: Aux.StrictViewId<A>
  tags?: NonEmptyArray<Aux.Tag<A>>
  links?: NonEmptyArray<Link>
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
        if (isTruthy(r.description) && !acc.description.includes(r.description)) {
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
        if (isTruthy(r.navigateTo) && !acc.navigateTo.includes(r.navigateTo)) {
          acc.navigateTo.push(r.navigateTo)
        }
        if (r.tags) {
          acc.tags.push(...r.tags)
        }
        if (r.links) {
          acc.links.push(...r.links)
        }
        return acc
      },
      {
        title: [] as string[],
        description: [] as string[],
        technology: [] as string[],
        kind: [] as Aux.RelationKind<A>[],
        head: [] as RelationshipArrowType[],
        tail: [] as RelationshipArrowType[],
        color: [] as Color[],
        tags: [] as Aux.Tag<A>[],
        links: [] as Link[],
        line: [] as RelationshipLineType[],
        navigateTo: [] as Aux.ViewId<A>[],
      },
    ),
  )

  let technology = only(allprops.technology)
  let title = only(allprops.title) ?? (allprops.title.length > 1 ? '[...]' : null)

  const tags = unique(allprops.tags)
  let merged = pickBy(
    {
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
      ...isNonEmptyArray(allprops.links) && { links: allprops.links },
      ...isNonEmptyArray(tags) && { tags },
    },
    isTruthy,
  )

  if (prefer) {
    return {
      ...merged,
      ...pickBy(pickRelationshipProps(prefer), isTruthy),
    }
  }
  return merged
}
