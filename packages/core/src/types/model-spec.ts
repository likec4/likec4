import type { IsAny } from 'type-fest'
import type * as aux from './aux'
import type { AnyAux } from './aux'
import type {
  Icon,
} from './scalar'
import type {
  BorderStyle,
  Color,
  ColorLiteral,
  ElementShape,
  RelationshipArrowType,
  RelationshipLineType,
  ShapeSize,
  SpacingSize,
  TextSize,
  ThemeColor,
  ThemeColorValues,
} from './styles'

/**
 * Element and deployment kind specification
 */
export interface ElementSpecification {
  technology?: string
  notation?: string
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
  color: ColorLiteral | ThemeColor
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
  technology?: string
  notation?: string
  color?: Color
  line?: RelationshipLineType
  head?: RelationshipArrowType
  tail?: RelationshipArrowType
}

export interface Specification<A extends AnyAux> {
  tags?: {
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
  metadataKeys?: IsAny<aux.MetadataKey<A>> extends true ? string[] : aux.MetadataKey<A>[]
  customColors?: Record<string, ThemeColorValues>
}
