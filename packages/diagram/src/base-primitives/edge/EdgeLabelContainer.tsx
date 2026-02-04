import type { DiagramEdge } from '@likec4/core/types'
import { cx } from '@likec4/styles/css'
import { EdgeLabelRenderer } from '@xyflow/react'
import type { HTMLAttributes } from 'react'
import { isNumber } from 'remeda'
import type { UndefinedOnPartialDeep } from 'type-fest'
import type { BaseEdgePropsWithData } from '../../base/types'

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

  edgeProps: BaseEdgePropsWithData<Data>
}

const toCssVarValue = (value: number | string | undefined) => {
  if (value === undefined) return ''
  return isNumber(value) ? `${Math.trunc(value)}px` : value
}

export function EdgeLabelContainer({
  edgeProps: {
    id,
    selected = false,
    data: {
      hovered: isHovered = false,
      active: isActive = false,
      dimmed: isDimmed = false,
      labelBBox,
      color = 'gray',
    },
    animated,
  },
  labelPosition: labelXY,
  className,
  style: _, // omit styles for container
  children,
  ...rest
}: EdgeLabelContainerProps) {
  let labelX = labelXY?.x ?? labelBBox?.x,
    labelY = labelXY?.y ?? labelBBox?.y

  if (labelX === undefined || labelY === undefined) {
    return null
  }
  const translate = labelXY?.translate ?? ''

  animated = animated || isActive

  return (
    <EdgeLabelRenderer>
      <div
        key={id}
        {...rest}
        className={cx(
          'nodrag nopan',
          'likec4-edge-label-container',
          className,
        )}
        data-likec4-hovered={isHovered}
        data-likec4-color={color}
        data-edge-active={isActive}
        data-edge-animated={animated || isActive}
        {...animated && {
          'data-likec4-animated': animated,
        }}
        {...selected !== false && {
          'data-likec4-selected': selected,
        }}
        {...isDimmed !== false && {
          'data-likec4-dimmed': isDimmed,
        }}
        style={{
          transform: `translate(${toCssVarValue(labelX)}, ${toCssVarValue(labelY)}) ${translate}`,
        }}
      >
        <div
          style={labelBBox ?
            {
              maxWidth: labelBBox.width + 20,
            } :
            undefined}>
          {children}
        </div>
      </div>
    </EdgeLabelRenderer>
  )
}
