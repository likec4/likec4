import type { IsNever } from 'type-fest'
import type * as aux from './aux'
import type { Any } from './aux'
import type * as scalar from './scalar'
import type {
  Icon,
} from './scalar'
import type {
  BorderStyle,
  Color,
  ColorLiteral,
  CustomColorDefinitions,
  ElementShape,
  RelationshipArrowType,
  RelationshipLineType,
  ShapeSize,
  SpacingSize,
  TextSize,
  ThemeColor,
} from './styles'

/**
 * Element and deployment kind specification
 */
export interface ElementSpecification {
  tags?: scalar.Tag[]
  technology?: scalar.MarkdownOrString
  notation?: scalar.MarkdownOrString
  style: {
    shape?: ElementShape
    icon?: Icon
    color?: Color
    border?: BorderStyle
    opacity?: number
    size?: ShapeSize
    padding?: SpacingSize
    textSize?: TextSize
    multiple?: boolean
  }
}

export interface TagSpecification {
  color: ThemeColor | ColorLiteral
}

/**
 * Checks if tag color is defined in the specification
 * Expects HEX, `rgb(...)` or `rgba(...)` color
 */
export function isTagColorSpecified(spec: string | TagSpecification): spec is { color: ColorLiteral } {
  const color = typeof spec === 'string' ? spec : spec.color
  return color.startsWith('#') || color.startsWith('rgb')
}

export interface RelationshipSpecification {
  technology?: scalar.MarkdownOrString
  notation?: scalar.MarkdownOrString
  color?: Color
  line?: RelationshipLineType
  head?: RelationshipArrowType
  tail?: RelationshipArrowType
}

export type Specification<A> = A extends Any ? {
    tags: {
      [key in aux.Tag<A>]: TagSpecification
    }
    elements: {
      [key in aux.ElementKind<A>]: Partial<ElementSpecification>
    }
    deployments: {
      [key in aux.DeploymentKind<A>]: Partial<ElementSpecification>
    }
    relationships: {
      [key in aux.RelationKind<A>]: Partial<RelationshipSpecification>
    }
    // dprint-ignore
    metadataKeys?: IsNever<aux.MetadataKey<A>> extends true ? never : aux.MetadataKey<A>[]
    customColors?: CustomColorDefinitions
  } :
  never
