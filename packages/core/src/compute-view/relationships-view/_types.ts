import { type ElementModel } from '../../model/ElementModel'
import type { RelationshipModel } from '../../model/RelationModel'

// type Pair = {
//   left: ReadonlySet<ElementModel>
//   relationships: ReadonlySet<RelationshipModel>
//   right: ReadonlySet<ElementModel>
// }

export type RelationshipsViewData = {
  incomers: ReadonlySet<ElementModel>
  incoming: ReadonlySet<RelationshipModel>
  subjects: ReadonlySet<ElementModel>
  outgoing: ReadonlySet<RelationshipModel>
  outgoers: ReadonlySet<ElementModel>
}
