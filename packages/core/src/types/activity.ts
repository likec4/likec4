import type { NonEmptyArray } from './_common'
import type { Link } from './element'
import type { FqnRef } from './expression-v2'
import type { RelationId, RelationshipArrowType, RelationshipKind, RelationshipLineType } from './relation'
import type { ActivityId, Fqn, Tag } from './scalars'
import type { Color } from './theme'
import type { ViewId } from './view'

export interface Activity {
  readonly id: ActivityId
  readonly name: string
  readonly title?: string
  readonly description?: string
  readonly technology?: string
  readonly tags?: NonEmptyArray<Tag> | null
  readonly links?: NonEmptyArray<Link> | null
  // Link to dynamic view
  readonly navigateTo?: ViewId
  readonly metadata?: { [key: string]: string }
  readonly steps: ReadonlyArray<ActivityStep>

  /**
   * Reference to parent model element
   */
  readonly modelRef: Fqn
}

export interface ActivityStep {
  readonly id: RelationId
  readonly isBackward?: boolean
  readonly target: FqnRef
  readonly title: string
  readonly description?: string
  readonly technology?: string
  readonly tags?: NonEmptyArray<Tag> | null
  readonly kind?: RelationshipKind
  readonly color?: Color
  readonly line?: RelationshipLineType
  readonly head?: RelationshipArrowType
  readonly tail?: RelationshipArrowType
  readonly links?: NonEmptyArray<Link> | null
  // Link to dynamic view
  readonly navigateTo?: ViewId
  readonly metadata?: { [key: string]: string }
}
