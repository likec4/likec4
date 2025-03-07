import { type DiagramEdge, extractStep, isStepEdgeId } from '@likec4/core'
import { type BoxProps, Box, createPolymorphicComponent, Text } from '@mantine/core'
import { EdgeLabelRenderer } from '@xyflow/react'
import clsx from 'clsx'
import { type PropsWithChildren, forwardRef } from 'react'
import { isNumber, isTruthy } from 'remeda'
import type { UndefinedOnPartialDeep } from 'type-fest'
import { useIsZoomTooSmall } from '../../../hooks/useXYFlow'
import { getVarName } from '../../../utils/css'
import { ZIndexes } from '../../const'
import type { EdgeProps } from '../../types'
import * as css from './EdgeLabel.css'

type Data = UndefinedOnPartialDeep<
  Pick<
    DiagramEdge,
    | 'label'
    | 'technology'
    | 'labelBBox'
    | 'color'
  >
>

type EdgeLabelProps = PropsWithChildren<
  BoxProps & {
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
>

const toCssVarValue = (value: number | string | undefined) => {
  if (value === undefined) return undefined
  return isNumber(value) ? `${value}px` : value
}

const varTranslate = getVarName(css.varTranslate)

export const EdgeLabel = createPolymorphicComponent<'div', EdgeLabelProps>(
  forwardRef<HTMLDivElement, EdgeLabelProps>(({
    edgeProps: {
      id,
      data: {
        technology,
        hovered: isHovered = false,
        active: isActive = false,
        dimmed: isDimmed = false,
        labelBBox,
        ...data
      },
    },
    labelPosition: labelXY,
    className,
    style,
    children,
    ...rest
  }, ref) => {
    const isZoomTooSmall = useIsZoomTooSmall()
    const stepNum = isStepEdgeId(id) ? extractStep(id) : null

    let zIndex = ZIndexes.Edge
    if (isHovered || isActive) {
      // Move above the elements
      zIndex = ZIndexes.Element + 1
    }

    let labelX = labelXY?.x ?? labelBBox?.x,
      labelY = labelXY?.y ?? labelBBox?.y

    if (labelX === undefined || labelY === undefined || isZoomTooSmall) {
      return null
    }
    const translate = labelXY?.translate

    return (
      <EdgeLabelRenderer>
        <Box
          className={clsx(
            'nodrag nopan',
            css.edgeLabelContainer,
            className,
          )}
          data-likec4-color={data.color ?? 'gray'}
          data-edge-active={isActive}
          data-edge-animated={isActive}
          data-edge-hovered={isHovered}
          {...isDimmed !== false && {
            'data-edge-dimmed': isDimmed,
          }}
          style={{
            top: toCssVarValue(labelY),
            left: toCssVarValue(labelX),
            ...(translate && {
              [varTranslate]: translate,
            }),
            ...(labelBBox && {
              maxWidth: labelBBox.width + 18,
            }),
            zIndex,
            ...style,
          }}
        >
          <Box ref={ref} className={css.edgeLabel} {...rest}>
            {stepNum !== null && (
              <Box className={css.stepEdgeNumber}>
                {stepNum}
              </Box>
            )}
            <Box className={css.secondColumn}>
              {isTruthy(data.label) && (
                <Text component="div" className={css.edgeLabelText} lineClamp={5}>
                  {data.label}
                </Text>
              )}
              {isTruthy(technology) && (
                <Text component="div" className={css.edgeLabelTechnology}>
                  {'[ ' + technology + ' ]'}
                </Text>
              )}
              {children}
            </Box>
          </Box>
        </Box>
      </EdgeLabelRenderer>
    )
  }),
)
EdgeLabel.displayName = 'EdgeLabel'
