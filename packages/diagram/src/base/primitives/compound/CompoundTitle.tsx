import type { DiagramNode } from '@likec4/core'
import { Box, Text } from '@mantine/core'
import clsx from 'clsx'
import type { NodeProps } from '../../types'
import * as css from './CompoundTitle.css'
import { IconRenderer } from '../../../context'

type Data = Pick<
  DiagramNode,
  | 'color'
  | 'title'
  | 'icon'
>

type CompoundTitleProps = NodeProps<Data>

export function CompoundTitle({ id, data }: CompoundTitleProps) {
  const elementIcon = IconRenderer({
    element: {
      id,
      title: data.title,
      icon: data.icon,
    },
    className: css.icon,
  })

  return (
    <Box
      className={clsx(
        css.compoundTitle,
        'likec4-compound-title',
      )}>
      {elementIcon}
      <Text className={css.title} truncate="end">
        {data.title}
      </Text>
    </Box>
  )
}
