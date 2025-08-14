import type { DiagramEdge } from '@likec4/core/types'
import { css, cx } from '@likec4/styles/css'
import { EdgeLabelRenderer } from '@xyflow/react'
import { type HTMLAttributes } from 'react'
import { isNumber } from 'remeda'
import type { UndefinedOnPartialDeep } from 'type-fest'
import { ZIndexes } from '../../const'
import type { EdgeProps } from '../../types'

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
  return isNumber(value) ? `${Math.round(value)}px` : value
}

export function EdgeLabelContainer({
  edgeProps: {
    id,
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
}: EdgeLabelContainerProps) {
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
    <EdgeLabelRenderer key={id}>
      <div
        key={id}
        className={cx(
          css({
            display: {
              _reduceGraphicsOnPan: 'none',
              _smallZoom: 'none',
            },
          }),
          'nodrag nopan',
          'likec4-edge-label-container',
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
          ...(labelBBox && {
            maxWidth: labelBBox.width + 18,
          }),
          zIndex,
          ...style,
          transform: `translate(${toCssVarValue(labelX)}, ${toCssVarValue(labelY)}) ${translate || ''}`,
        }}
        {...rest}
      >
        {children}
      </div>
    </EdgeLabelRenderer>
  )
}
