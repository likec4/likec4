import type { DiagramNode } from '@likec4/core/types'
import { Text } from '@mantine/core'
import { IconRenderer } from '../../../context'
import type { NodeProps } from '../../types'

type Data = Pick<
  DiagramNode,
  | 'color'
  | 'title'
  | 'icon'
  | 'style'
>

type CompoundTitleProps = NodeProps<Data>

export function CompoundTitle({ id, data }: CompoundTitleProps) {
  const elementIcon = IconRenderer({
    element: {
      id,
      title: data.title,
      icon: data.icon,
    },
    className: 'likec4-compound-icon',
  })

  return (
    <div className={'likec4-compound-title-container'}>
      {elementIcon}
      <Text component="h3" className={'likec4-compound-title'} truncate="end">
        {data.title}
      </Text>
    </div>
  )
}
