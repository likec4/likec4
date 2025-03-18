import { type DiagramEdge, extractStep, isStepEdgeId } from '@likec4/core'
import { cx } from '@likec4/styles/css'
import { type BoxProps, Box, createPolymorphicComponent, Text } from '@mantine/core'
import { EdgeLabelRenderer } from '@xyflow/react'
import { type PropsWithChildren, forwardRef } from 'react'
import { isNumber, isTruthy } from 'remeda'
import type { UndefinedOnPartialDeep } from 'type-fest'
import { useIsZoomTooSmall } from '../../../hooks/useXYFlow'
import { ZIndexes } from '../../const'
import type { EdgeProps } from '../../types'
import { edgeVars } from './edge.css'
import * as styles from './EdgeLabel.css'
import { labelsva } from './EdgeLabel.css'

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
    const classes = labelsva({
      isStepEdge: isStepEdgeId(id),
    })

    return (
      <EdgeLabelRenderer>
        <Box
          className={cx(
            edgeVars,
            classes.root,
            'nodrag nopan',
            className,
          )}
          data-likec4-color={data.color ?? 'gray'}
          data-edge-active={isActive}
          data-edge-animated={isActive}
          data-likec4-hovered={isHovered}
          {...isDimmed !== false && {
            'data-likec4-dimmed': isDimmed,
          }}
          style={{
            top: toCssVarValue(labelY),
            left: toCssVarValue(labelX),
            ...(translate && {
              [styles.translate.var]: translate,
            }),
            ...(labelBBox && {
              maxWidth: labelBBox.width + 18,
            }),
            zIndex,
            ...style,
          }}
        >
          <Box ref={ref} className={classes.wrapper!} {...rest}>
            {stepNum !== null && (
              <Box className={classes.stepNumber!}>
                {stepNum}
              </Box>
            )}
            <Box className={classes.labelContents!}>
              {isTruthy(data.label) && (
                <Text component="div" className={classes.labelText!} lineClamp={5}>
                  {data.label}
                </Text>
              )}
              {isTruthy(technology) && (
                <Text component="div" className={classes.labelTechnology!}>
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
