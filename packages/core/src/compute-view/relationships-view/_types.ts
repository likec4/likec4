import { type ElementModel } from '../../model/ElementModel'
import type { RelationshipModel } from '../../model/RelationModel'
import type { Any, AnyAux } from '../../types'

// type Pair = {
//   left: ReadonlySet<ElementModel>
//   relationships: ReadonlySet<RelationshipModel>
//   right: ReadonlySet<ElementModel>
// }

export type RelationshipsViewData<M extends AnyAux = Any> = {
  incomers: ReadonlySet<ElementModel<M>>
  incoming: ReadonlySet<RelationshipModel<M>>
  subjects: ReadonlySet<ElementModel<M>>
  outgoing: ReadonlySet<RelationshipModel<M>>
  outgoers: ReadonlySet<ElementModel<M>>
}
