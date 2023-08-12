import type { Opaque } from './opaque'
import type { Fqn, Tag } from './element'

export type RelationID = Opaque<string, 'RelationID'>

export interface Relation {
  readonly id: RelationID
  readonly source: Fqn
  readonly target: Fqn
  readonly title: string
  readonly tags?: Tag[]
}
