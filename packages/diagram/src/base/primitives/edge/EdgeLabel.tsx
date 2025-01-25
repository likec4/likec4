import { type DiagramEdge, extractStep, isStepEdgeId } from '@likec4/core'
import { type BoxProps, Box, createPolymorphicComponent, Stack, Text } from '@mantine/core'
import { assignInlineVars } from '@vanilla-extract/dynamic'
import { EdgeLabelRenderer } from '@xyflow/react'
import clsx from 'clsx'
import { type PropsWithChildren, forwardRef } from 'react'
import { isNumber, isTruthy } from 'remeda'
import type { UndefinedOnPartialDeep } from 'type-fest'
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

// type EdgeLabelProps = PropsWithChildren<
//   EdgeProps<Data> & {
//     labelXY?: XYPosition | undefined
//     className?: string
//     style?: MantineStyleProp
//   }
// >

// export function EdgeLabel({
//   id,
//   children,
//   data: {
//     technology,
//     hovered: isHovered = false,
//     active: isActive = false,
//     dimmed: isDimmed = false,
//     labelBBox,
//     ...data
//   },
//   labelXY,
//   className,
//   style,
// }: EdgeLabelProps) {
//   const stepNum = isStepEdgeId(id) ? extractStep(id) : null

//   let zIndex = ZIndexes.Edge
//   if (isHovered) {
//     // Move above the elements
//     zIndex = ZIndexes.Element + 1
//   }

//   let labelX = labelXY?.x ?? labelBBox?.x ?? 0,
//     labelY = labelXY?.y ?? labelBBox?.y ?? 0

//   return (
//     <EdgeLabelRenderer>
//       <Box
//         className={clsx(
//           'nodrag nopan',
//           css.container,
//           css.edgeLabel,
//           isDimmed && css.dimmed,
//           className,
//         )}
//         data-likec4-color={data.color ?? 'gray'}
//         data-edge-active={isActive}
//         data-edge-animated={isActive}
//         data-edge-hovered={isHovered}
//         data-edge-dimmed={isDimmed}
//         style={{
//           ...assignInlineVars({
//             [css.varLabelX]: `${labelX}px`,
//             [css.varLabelY]: `${labelY}px`,
//           }),
//           ...(labelBBox && {
//             maxWidth: labelBBox.width + 18,
//           }),
//           zIndex,
//           ...style,
//         }}
//       >
//         {stepNum !== null && (
//           <Box className={css.stepEdgeNumber}>
//             {stepNum}
//           </Box>
//         )}
//         <Stack gap={4} align="center">
//           {isTruthy(data.label) && (
//             <Text component="div" className={css.edgeLabelText} lineClamp={5}>
//               {data.label}
//             </Text>
//           )}
//           {isTruthy(technology) && (
//             <Text component="div" className={css.edgeLabelTechnology}>
//               {'[ ' + technology + ' ]'}
//             </Text>
//           )}
//           {children}
//         </Stack>
//       </Box>
//     </EdgeLabelRenderer>
//   )
// }

type EdgeLabelProps = PropsWithChildren<
  BoxProps & {
    /**
     * label css translate
     * @example
     *   labelXY={{ x: 10, y: 20 }} // translate(10px, 20px)
     *   labelXY={{ x: '50%', y: '50%' }} // translate(50%, 50%)
     */
    labelXY?: {
      x: number | string
      y: number | string
    } | undefined
    edgeProps: EdgeProps<Data>
  }
>

const toCssVarValue = (value: number | string) => {
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
    labelXY,
    className,
    style,
    children,
    ...rest
  }, ref) => {
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
          ref={ref}
          className={clsx(
            'nodrag nopan',
            css.container,
            css.edgeLabel,
            isDimmed && css.dimmed,
            className,
          )}
          data-likec4-color={data.color ?? 'gray'}
          data-edge-active={isActive}
          data-edge-animated={isActive}
          data-edge-hovered={isHovered}
          data-edge-dimmed={isDimmed}
          style={{
            ...assignInlineVars({
              [css.varLabelX]: toCssVarValue(labelX),
              [css.varLabelY]: toCssVarValue(labelY),
            }),
            ...(labelBBox && {
              maxWidth: labelBBox.width + 18,
            }),
            zIndex,
            ...style,
          }}
          {...rest}
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
  }),
)
EdgeLabel.displayName = 'EdgeLabel'
