import { type DiagramEdge, extractStep, isStepEdgeId } from '@likec4/core'
import { Box, Stack, Text } from '@mantine/core'
import { assignInlineVars } from '@vanilla-extract/dynamic'
import { type XYPosition, EdgeLabelRenderer } from '@xyflow/react'
import clsx from 'clsx'
import { type PropsWithChildren } from 'react'
import { isTruthy } from 'remeda'
import type { UndefinedOnPartialDeep } from 'type-fest'
import { ZIndexes } from '../../const'
import type { EdgeProps } from '../../types'
import * as css from './EdgeLabel.css'

type Data = UndefinedOnPartialDeep<
  Pick<
    DiagramEdge,
    | 'id'
    | 'label'
    | 'technology'
    | 'labelBBox'
    | 'color'
  >
>

type EdgeLabelProps = PropsWithChildren<EdgeProps<Data>> & {
  labelXY?: XYPosition | undefined
}

export function EdgeLabel({
  children,
  data: {
    id,
    technology,
    hovered: isHovered = false,
    active: isActive = false,
    dimmed: isDimmed = false,
    labelBBox,
    ...data
  },
  labelXY,
}: EdgeLabelProps) {
  const stepNum = isStepEdgeId(id) ? extractStep(id) : null

  let zIndex = ZIndexes.Edge
  if (isHovered) {
    // Move above the elements
    zIndex = ZIndexes.Element + 1
  }

  let labelX = labelXY?.x ?? labelBBox?.x ?? 0,
    labelY = labelXY?.y ?? labelBBox?.y ?? 0

  return (
    <EdgeLabelRenderer>
      <Box
        className={clsx(
          'nodrag nopan',
          css.container,
          css.edgeLabel,
          isDimmed && css.dimmed,
        )}
        data-likec4-color={data.color ?? 'gray'}
        data-edge-active={isActive}
        data-edge-animated={isActive}
        data-edge-hovered={isHovered}
        style={{
          ...assignInlineVars({
            [css.varLabelX]: `${labelX}px`,
            [css.varLabelY]: `${labelY}px`,
          }),
          ...(labelBBox && {
            maxWidth: labelBBox.width + 18,
          }),
          zIndex,
        }}
      >
        {stepNum !== null && (
          <Box className={css.stepEdgeNumber}>
            {stepNum}
          </Box>
        )}
        <Stack gap={4} align="center">
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
        </Stack>
      </Box>
    </EdgeLabelRenderer>
  )
}
