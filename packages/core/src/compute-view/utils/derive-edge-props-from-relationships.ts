import { isTruthy, only, pick, pickBy, pipe, reduce, unique } from 'remeda'
import type { Color, DeploymentRelation, Link, Tag, ViewId } from '../../types'
import type { Relation, RelationshipArrowType, RelationshipKind, RelationshipLineType } from '../../types/relation'
import { isNonEmptyArray } from '../../utils'

export function pickRelationshipProps(relation: Relation | DeploymentRelation) {
  return pick(relation, [
    'title',
    'description',
    'technology',
    'tags',
    'links',
    'kind',
    'color',
    'line',
    'head',
    'tail',
    'navigateTo'
  ])
}
type RelationshipProps = ReturnType<typeof pickRelationshipProps>

export function deriveEdgePropsFromRelationships(relations: Array<Relation | DeploymentRelation>) {
  // TODO:
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
        kind: [] as RelationshipKind[],
        head: [] as RelationshipArrowType[],
        tail: [] as RelationshipArrowType[],
        color: [] as Color[],
        tags: [] as Tag[],
        links: [] as Link[],
        line: [] as RelationshipLineType[],
        navigateTo: [] as ViewId[]
      }
    )
  )
  const tags = unique(allprops.tags)
  return pickBy(
    {
      title: only(allprops.title) ?? (allprops.title.length > 1 ? '[...]' : null),
      description: only(allprops.description),
      technology: only(allprops.technology),
      kind: only(allprops.kind),
      head: only(allprops.head),
      tail: only(allprops.tail),
      color: only(allprops.color),
      line: only(allprops.line),
      navigateTo: only(allprops.navigateTo),
      ...isNonEmptyArray(allprops.links) && { links: allprops.links },
      ...isNonEmptyArray(tags) && { tags }
    },
    isTruthy
  )
}
export type MergedRelationshipProps = ReturnType<typeof deriveEdgePropsFromRelationships>
