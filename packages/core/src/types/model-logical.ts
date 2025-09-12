import type * as aux from './_aux'
import type { AnyAux } from './_aux'
import type { Link } from './_common'
import type { FqnRef } from './fqnRef'
import type * as scalar from './scalar'
import type {
  BorderStyle,
  Color,
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
export const DefaultSize = 'md'
export const DefaultShapeSize: ShapeSize = DefaultSize
export const DefaultPaddingSize: SpacingSize = DefaultSize
export const DefaultTextSize: TextSize = DefaultSize

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

type WithSizes = Pick<ElementStyle, 'size' | 'padding' | 'textSize'>

/**
 * Ensures that the sizes are set to default values if they are not set
 */
export function ensureSizes<S extends WithSizes>({
  size,
  padding,
  textSize,
  ...rest
}: S): Omit<S, 'size' | 'padding' | 'textSize'> & Required<WithSizes> {
  size ??= DefaultSize
  textSize ??= size
  padding ??= size

  return {
    ...rest,
    size,
    padding,
    textSize,
  }
}

// dprint-ignore
export interface Element<A extends AnyAux = AnyAux>
  extends
    aux.WithOptionalTags<A>,
    aux.WithOptionalLinks,
    aux.WithMetadata<A>
{
  readonly id: aux.StrictFqn<A>
  readonly kind: aux.ElementKind<A>
  readonly title: string
  readonly description?: scalar.MarkdownOrString | null
  readonly technology?: string | null
  readonly tags?: aux.Tags<A> | null
  readonly links?: readonly Link[] | null
  readonly icon?: scalar.Icon
  readonly shape?: ElementShape
  readonly color?: Color
  readonly style?: ElementStyle
  readonly notation?: string | null
  readonly metadata?: aux.Metadata<A>
}

export const DefaultLineStyle: RelationshipLineType = 'dashed'
export const DefaultArrowType: RelationshipArrowType = 'normal'
export const DefaultRelationshipColor: ThemeColor = 'gray'

// dprint-ignore
export interface AbstractRelationship<A extends AnyAux>
  extends
    aux.WithOptionalTags<A>,
    aux.WithOptionalLinks,
    aux.WithMetadata<A>
{
  readonly id: scalar.RelationId
  readonly title?: string | null
  readonly description?: scalar.MarkdownOrString | null
  readonly technology?: string | null
  readonly kind?: aux.RelationKind<A>
  readonly color?: Color
  readonly line?: RelationshipLineType
  readonly head?: RelationshipArrowType
  readonly tail?: RelationshipArrowType
  readonly tags?: aux.Tags<A> | null
  readonly links?: readonly Link[] | null
  // Link to dynamic view
  readonly navigateTo?: aux.ViewId<A>
  readonly metadata?: aux.Metadata<A>
}

/**
 * Relationship between two model elements
 */
export interface Relationship<A extends AnyAux = AnyAux> extends AbstractRelationship<A> {
  readonly source: FqnRef.ModelRef<A>
  readonly target: FqnRef.ModelRef<A>
}

/**
 * Backward compatibility alias
 * @deprecated Use {@link Relationship} instead
 */
export type ModelRelation<A extends AnyAux = AnyAux> = Relationship<A>
