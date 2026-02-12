import type { ElementStyle } from '@likec4/core/types'
import { CompositeGeneratorNode, NL } from 'langium/generate'

export function printStyleBlock(style: Partial<ElementStyle>, node: CompositeGeneratorNode): void {
  const props: Array<[string, string | undefined]> = [
    ['shape', style.shape],
    ['color', style.color],
    ['icon', style.icon],
    ['iconColor', style.iconColor],
    ['iconSize', style.iconSize],
    ['iconPosition', style.iconPosition],
    ['border', style.border],
    ['opacity', style.opacity != null ? `${style.opacity}%` : undefined],
    ['size', style.size],
    ['padding', style.padding],
    ['textSize', style.textSize],
  ]

  const hasMultiple = style.multiple === true
  const definedProps = props.filter(([, v]) => v != null)

  if (definedProps.length === 0 && !hasMultiple) {
    return
  }

  node.append('style {', NL)
  node.indent({
    indentedChildren: indent => {
      for (const [key, value] of definedProps) {
        indent.append(key, ' ', value!, NL)
      }
      if (hasMultiple) {
        indent.append('multiple', NL)
      }
    },
    indentation: 2,
  })
  node.append('}', NL)
}

/**
 * Print style properties inline (for view rule style, specification element style)
 * where the `style { }` wrapper is already handled by the caller.
 */
export function printStyleProperties(style: Partial<ElementStyle>, indent: CompositeGeneratorNode): void {
  if (style.shape) indent.append('shape ', style.shape, NL)
  if (style.color) indent.append('color ', style.color, NL)
  if (style.icon) indent.append('icon ', style.icon, NL)
  if (style.iconColor) indent.append('iconColor ', style.iconColor, NL)
  if (style.iconSize) indent.append('iconSize ', style.iconSize, NL)
  if (style.iconPosition) indent.append('iconPosition ', style.iconPosition, NL)
  if (style.border) indent.append('border ', style.border, NL)
  if (style.opacity != null) indent.append('opacity ', `${style.opacity}%`, NL)
  if (style.size) indent.append('size ', style.size, NL)
  if (style.padding) indent.append('padding ', style.padding, NL)
  if (style.textSize) indent.append('textSize ', style.textSize, NL)
  if (style.multiple) indent.append('multiple', NL)
}
