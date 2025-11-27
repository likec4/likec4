import { extractStep, isStepEdgeId } from '@likec4/core'
import type { DiagramEdge } from '@likec4/core/types'
import { cx } from '@likec4/styles/css'
import { Box } from '@likec4/styles/jsx'
import { edgeLabel } from '@likec4/styles/recipes'
import type { HTMLMotionProps } from 'motion/react'
import * as m from 'motion/react-m'
import { type ReactNode, forwardRef } from 'react'
import { isTruthy } from 'remeda'
import type { UndefinedOnPartialDeep } from 'type-fest'
import type { BaseEdgePropsWithData } from '../../base/types'

type Data = UndefinedOnPartialDeep<
  Pick<
    DiagramEdge,
    | 'label'
    | 'technology'
  >
>

type EdgeLabelProps =
  & HTMLMotionProps<'div'>
  & {
    children?: ReactNode
    edgeProps: BaseEdgePropsWithData<Data>
    pointerEvents?: 'all' | 'none'
  }

export const EdgeLabel = forwardRef<HTMLDivElement, EdgeLabelProps>((
  {
    edgeProps: {
      id,
      data: {
        label,
        technology,
        hovered: isHovered = false,
      },
      selected = false,
      selectable = false,
    },
    pointerEvents = 'all',
    className,
    style: _style, // omit
    children,
    ...rest
  },
  ref,
) => {
  const stepNum = isStepEdgeId(id) ? extractStep(id) : null

  const hasLabel = isTruthy(label) || isTruthy(technology)

  return (
    <m.div
      ref={ref}
      className={cx(
        // This class is queried by RelationshipPopover to position near the edge label
        'likec4-edge-label',
        edgeLabel({
          pointerEvents,
          isStepEdge: stepNum !== null,
          cursor: selectable || stepNum !== null ? 'pointer' : 'default',
        }),
        className,
      )}
      data-edge-id={id}
      animate={{
        scale: isHovered && !selected ? 1.06 : 1,
      }}
      {...rest}
    >
      {stepNum !== null && (
        <Box className={'likec4-edge-label__step-number'}>
          {stepNum}
        </Box>
      )}
      {hasLabel && (
        <Box className={'likec4-edge-label__contents'}>
          {isTruthy(label) && (
            <Box
              lineClamp={5}
              className={'likec4-edge-label__text'}>
              {label}
            </Box>
          )}
          {isTruthy(technology) && (
            <Box className={'likec4-edge-label__technology'}>
              {'[ ' + technology + ' ]'}
            </Box>
          )}
          {children}
        </Box>
      )}
    </m.div>
  )
})
EdgeLabel.displayName = 'EdgeLabel'
