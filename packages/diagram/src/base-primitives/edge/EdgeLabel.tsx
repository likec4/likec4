import { extractStep, isStepEdgeId } from '@likec4/core'
import type { DiagramEdge } from '@likec4/core/types'
import { css, cx } from '@likec4/styles/css'
import { Box } from '@likec4/styles/jsx'
import { edgeLabel } from '@likec4/styles/recipes'
import type { HTMLMotionProps } from 'motion/react'
import * as m from 'motion/react-m'
import { forwardRef } from 'react'
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
    children?: React.ReactNode
    edgeProps: BaseEdgePropsWithData<Data>
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
    className,
    style: _style, // omit
    children,
    ...rest
  },
  ref,
) => {
  const stepNum = isStepEdgeId(id) ? extractStep(id) : null
  const classes = edgeLabel({
    isStepEdge: stepNum !== null,
    cursor: selectable || stepNum !== null ? 'pointer' : 'default',
  })

  const hasLabel = isTruthy(label) || isTruthy(technology)

  return (
    <m.div
      ref={ref}
      className={cx(classes.root, 'likec4-edge-label', className)}
      data-edge-id={id}
      animate={{
        scale: isHovered && !selected ? 1.06 : 1,
      }}
      {...rest}
    >
      {stepNum !== null && (
        <Box className={classes.stepNumber}>
          {stepNum}
        </Box>
      )}
      {hasLabel && (
        <Box className={classes.labelContents}>
          {isTruthy(label) && (
            <Box
              className={cx(
                classes.labelText,
                css({
                  lineClamp: 5,
                }),
              )}>
              {label}
            </Box>
          )}
          {isTruthy(technology) && (
            <Box className={classes.labelTechnology}>
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
