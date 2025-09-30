import type { Color, ComputedNodeStyle, NodeId } from '@likec4/core/types'
import { Text } from '@mantine/core'
import { IconRenderer } from '../../context/IconRenderer'

type RequiredData = {
  id: NodeId
  title: string
  color: Color
  style: ComputedNodeStyle
  icon?: string | null
}

type CompoundTitleProps = {
  data: RequiredData
}

export function CompoundTitle({ data }: CompoundTitleProps) {
  const elementIcon = IconRenderer({
    element: data,
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
