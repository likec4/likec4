import { type DiagramEdge, extractStep, isStepEdgeId } from '@likec4/core'
import { type BoxProps, Box, Text } from '@mantine/core'
import { type PropsWithChildren } from 'react'
import { isTruthy } from 'remeda'
import type { UndefinedOnPartialDeep } from 'type-fest'
import type { EdgeProps } from '../../types'
import { labelsva } from './EdgeLabel.css'

type Data = UndefinedOnPartialDeep<
  Pick<
    DiagramEdge,
    | 'label'
    | 'technology'
  >
>

type EdgeLabelProps = PropsWithChildren<
  BoxProps & {
    edgeProps: EdgeProps<Data>
  }
>

export function EdgeLabel({
  edgeProps: {
    id,
    data: {
      label,
      technology,
    },
  },
  className,
  style,
  children,
  ...rest
}: EdgeLabelProps) {
  const stepNum = isStepEdgeId(id) ? extractStep(id) : null
  const classes = labelsva({
    isStepEdge: stepNum !== null,
  })

  return (
    <Box className={classes.root!} {...rest}>
      {stepNum !== null && (
        <Box className={classes.stepNumber!}>
          {stepNum}
        </Box>
      )}
      <Box className={classes.labelContents!}>
        {isTruthy(label) && (
          <Text component="div" className={classes.labelText!} lineClamp={5}>
            {label}
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
  )
}
