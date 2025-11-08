import type { DiagramEdge } from '@likec4/core/types'
import { cx } from '@likec4/styles/css'
import { EdgeLabelRenderer } from '@xyflow/react'
import { type HTMLAttributes, useCallback } from 'react'
import { isNumber } from 'remeda'
import type { UndefinedOnPartialDeep } from 'type-fest'
import { ZIndexes } from '../../base/const'
import type { BaseEdgePropsWithData } from '../../base/types'
import { useXYStore } from '../../hooks/useXYFlow'

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
  if (value === undefined) return undefined
  return isNumber(value) ? `${Math.round(value)}px` : value
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
  },
  labelPosition: labelXY,
  className,
  style,
  children,
  ...rest
}: EdgeLabelContainerProps) {
  let zIndex = useXYStore(
    useCallback((state) => {
      return state.edgeLookup.get(id)?.zIndex ?? ZIndexes.Edge
    }, [id]),
  )
  // Move above the elements
  if (isHovered || isActive) {
    zIndex += 100
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
        data-edge-animated={isActive}
        {...selected !== false && {
          'data-likec4-selected': selected,
        }}
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
      >
        {children}
      </div>
    </EdgeLabelRenderer>
  )
}
