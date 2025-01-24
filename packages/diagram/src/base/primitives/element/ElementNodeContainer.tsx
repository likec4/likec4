import type { DiagramNode } from '@likec4/core'
import { Box } from '@mantine/core'
import clsx from 'clsx'
import { type HTMLMotionProps, m } from 'framer-motion'
import { type PropsWithChildren } from 'react'
import type { NodeProps } from '../../types'
import * as css from './ElementNodeContainer.css'

type Data = Pick<
  DiagramNode,
  | 'color'
  | 'shape'
>

type ElementNodeContainerProps = PropsWithChildren<NodeProps<Data>> & {
  motionProps?: Omit<HTMLMotionProps<'div'>, 'className' | 'style'>
}

export function ElementNodeContainer({
  selected = false,
  selectable = false,
  data: {
    hovered: isHovered = false,
    dimmed: isDimmed = false,
    ...data
  },
  children,
  motionProps,
}: ElementNodeContainerProps) {
  let scale = 1
  switch (true) {
    case isHovered:
      scale = 1.05
      break
    case selected:
      scale = 1.02
      break
  }

  return (
    <Box
      component={m.div}
      className={clsx([
        css.container,
        isDimmed && css.dimmed,
        'likec4-element-node',
      ])}
      layoutRoot
      {...selectable && {
        animate: {
          scale,
        },
        whileTap: { scale: 0.98 },
      }}
      data-hovered={isHovered}
      data-likec4-color={data.color}
      data-likec4-shape={data.shape}
      {...motionProps}
    >
      {children}
    </Box>
  )
}
