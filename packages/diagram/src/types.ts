import type { Fqn, RelationID, ViewID } from '@likec4/core'
import type { Simplify } from 'type-fest'

type TaggedUnion<
  TagKey extends string,
  UnionMembers extends Record<string, Record<string, unknown>>
> = {
  [Name in keyof UnionMembers]: Simplify<{ [Key in TagKey]: Name } & UnionMembers[Name]>
}[keyof UnionMembers]

export type DiagramEditorCommand = TaggedUnion<'type', {
  // Sources
  showElement: {
    element: Fqn
  }
  showRelation: {
    relation: RelationID
  }
  showView: {
    view: ViewID
  }
}>
