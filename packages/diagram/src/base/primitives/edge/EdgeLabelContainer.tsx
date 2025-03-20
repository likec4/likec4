import { type DiagramEdge } from '@likec4/core'
import { css, cx } from '@likec4/styles/css'
import { createPolymorphicComponent } from '@mantine/core'
import { EdgeLabelRenderer } from '@xyflow/react'
import { type HTMLAttributes, forwardRef } from 'react'
import { isNumber } from 'remeda'
import type { UndefinedOnPartialDeep } from 'type-fest'
import { ZIndexes } from '../../const'
import type { EdgeProps } from '../../types'
import { edgeVars } from './edge.css'
import { edgeLabelContainer, translate as _translate } from './EdgeLabel.css'

type Data = UndefinedOnPartialDeep<
  Pick<
    DiagramEdge,
    | 'labelBBox'
    | 'color'
  >
>

type EdgeLabelContainerProps = HTMLAttributes<HTMLDivElement> & {
  /**
   * label position with optional translate
   */
  labelPosition?: {
    x?: number | undefined
    y?: number | undefined
    translate?: string | undefined
  } | undefined

  edgeProps: EdgeProps<Data>
}

const toCssVarValue = (value: number | string | undefined) => {
  if (value === undefined) return undefined
  return isNumber(value) ? `${value}px` : value
}

export const EdgeLabelContainer = createPolymorphicComponent<'div', EdgeLabelContainerProps>(
  forwardRef<HTMLDivElement, EdgeLabelContainerProps>(({
    edgeProps: {
      data: {
        hovered: isHovered = false,
        active: isActive = false,
        dimmed: isDimmed = false,
        labelBBox,
        color = 'gray',
      },
    },
    labelPosition: labelXY,
    className,
    style,
    children,
    ...rest
  }, ref) => {
    let zIndex = ZIndexes.Edge
    if (isHovered || isActive) {
      // Move above the elements
      zIndex = ZIndexes.Element + 1
    }

    let labelX = labelXY?.x ?? labelBBox?.x,
      labelY = labelXY?.y ?? labelBBox?.y

    if (labelX === undefined || labelY === undefined) {
      return null
    }
    const translate = labelXY?.translate

    return (
      <EdgeLabelRenderer>
        <div
          ref={ref}
          className={cx(
            css({
              likec4RelationPalette: color,
            }),
            edgeVars,
            edgeLabelContainer,
            'nodrag nopan',
            className,
          )}
          data-likec4-hovered={isHovered}
          data-likec4-color={color}
          data-edge-active={isActive}
          data-edge-animated={isActive}
          {...isDimmed !== false && {
            'data-likec4-dimmed': isDimmed,
          }}
          style={{
            top: toCssVarValue(labelY),
            left: toCssVarValue(labelX),
            ...(translate && {
              [_translate.var]: translate,
            }),
            ...(labelBBox && {
              maxWidth: labelBBox.width + 18,
            }),
            zIndex,
            ...style,
          }}
          {...rest}
        >
          {children}
        </div>
      </EdgeLabelRenderer>
    )
  }),
)
EdgeLabelContainer.displayName = 'EdgeLabelContainer'
