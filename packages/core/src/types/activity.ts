import type { NonEmptyArray } from './_common'
import type { Link } from './element'
import type { FqnRef } from './expression-v2'
import type { RelationId, RelationshipArrowType, RelationshipKind, RelationshipLineType } from './relation'
import type { ActivityId, Tag } from './scalars'
import type { Color } from './theme'
import type { ViewId } from './view'

export interface Activity {
  readonly id: ActivityId
  readonly name: string
  readonly steps: ActivityStep[]
}

export interface ActivityStep {
  readonly id: RelationId
}
