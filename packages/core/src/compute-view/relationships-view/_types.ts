import type { ElementModel, RelationshipModel } from '../../model'
import type { AnyAux, Unknown } from '../../types'

// type Pair = {
//   left: ReadonlySet<ElementModel>
//   relationships: ReadonlySet<RelationshipModel>
//   right: ReadonlySet<ElementModel>
// }

export type RelationshipsViewData<M extends AnyAux = Unknown> = {
  incomers: ReadonlySet<ElementModel<M>>
  incoming: ReadonlySet<RelationshipModel<M>>
  subjects: ReadonlySet<ElementModel<M>>
  outgoing: ReadonlySet<RelationshipModel<M>>
  outgoers: ReadonlySet<ElementModel<M>>
}
