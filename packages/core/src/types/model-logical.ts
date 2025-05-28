import type { Link } from './_common'
import type { AnyAux, Aux, UnknownAux } from './aux'
import type { FqnRef } from './fqnRef'
import type { Icon } from './scalars'
import type {
  BorderStyle,
  ElementShape,
  RelationshipArrowType,
  RelationshipLineType,
  ShapeSize,
  SpacingSize,
  TextSize,
  ThemeColor,
} from './styles'

export const DefaultThemeColor: ThemeColor = 'primary'
export const DefaultElementShape: ElementShape = 'rectangle'
export const DefaultShapeSize: ShapeSize = 'md'
export const DefaultPaddingSize: SpacingSize = 'md'
export const DefaultTextSize: TextSize = 'md'

export interface ElementStyle {
  readonly border?: BorderStyle
  /**
   * In percentage 0-100, 0 is fully transparent
   *
   * @default 100
   */
  readonly opacity?: number
  /**
   * If true, the element is rendered as multiple shapes
   * @default false
   */
  readonly multiple?: boolean

  /**
   * Shape size
   *
   * @default 'md'
   */
  readonly size?: ShapeSize

  readonly padding?: SpacingSize

  readonly textSize?: TextSize
}

export interface Element<A extends AnyAux = UnknownAux> {
  readonly id: Aux.Strict.Fqn<A>
  readonly kind: Aux.ElementKind<A>
  readonly title: string
  readonly description?: string | null
  readonly technology?: string | null
  readonly tags?: Aux.Tags<A> | null
  readonly links?: readonly Link[] | null
  readonly icon?: Icon
  readonly shape?: ElementShape
  readonly color?: ThemeColor
  readonly style?: ElementStyle
  readonly notation?: string
  readonly metadata?: Aux.Metadata<A>
}

export const DefaultLineStyle: RelationshipLineType = 'dashed'
export const DefaultArrowType: RelationshipArrowType = 'normal'
export const DefaultRelationshipColor: ThemeColor = 'gray'

export interface AbstractRelationship<A extends AnyAux> {
  readonly id: Aux.Strict.RelationId<A>
  readonly title?: string | null
  readonly description?: string | null
  readonly technology?: string | null
  readonly kind?: Aux.RelationKind<A>
  readonly color?: ThemeColor
  readonly line?: RelationshipLineType
  readonly head?: RelationshipArrowType
  readonly tail?: RelationshipArrowType
  readonly tags?: Aux.Tags<A> | null
  readonly links?: readonly Link[] | null
  // Link to dynamic view
  readonly navigateTo?: Aux.ViewId<A>
  readonly metadata?: Aux.Metadata<A>
}

/**
 * Relationship between two model elements
 */
export interface Relationship<A extends AnyAux = UnknownAux> extends AbstractRelationship<A> {
  readonly source: FqnRef.ModelRef<A>
  readonly target: FqnRef.ModelRef<A>
}

/**
 * Backward compatibility alias
 * @deprecated Use {@link Relationship} instead
 */
export type ModelRelation<A extends AnyAux = UnknownAux> = Relationship<A>
