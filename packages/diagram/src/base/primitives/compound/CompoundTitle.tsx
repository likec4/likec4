import type { DiagramNode } from '@likec4/core'
import { Box, Text } from '@mantine/core'
import clsx from 'clsx'
import type { NodeProps } from '../../types'
import * as css from './CompoundTitle.css'

type Data = Pick<
  DiagramNode,
  | 'color'
  | 'title'
>

type CompoundTitleProps = NodeProps<Data>

export function CompoundTitle({ data }: CompoundTitleProps) {
  const isHovered = data.hovered ?? false

  return (
    <Box
      className={clsx(
        css.compoundTitle,
        'likec4-compound-title',
      )}>
      <Text className={css.title} truncate="end">
        {data.title}
      </Text>
    </Box>
  )
}
