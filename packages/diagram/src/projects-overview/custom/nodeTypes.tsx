import { IconZoomScan } from '@tabler/icons-react'
import {
  DefaultHandles,
  ElementActionButtons,
  ElementData,
  ElementNodeContainer,
  ElementShape,
} from '../../base-primitives'
import type { ProjectsOverviewTypes } from '../_types'

export function ProjectNode(props: ProjectsOverviewTypes.NodeProps<'project'>) {
  return (
    <ElementNodeContainer
      key={props.id}
      layout
      nodeProps={props}
    >
      <ElementShape {...props} />
      <ElementData {...props} />
      <ElementActionButtons
        {...props}
        buttons={[
          {
            key: 'navigate',
            icon: <IconZoomScan />,
            onClick: (e) => {
            },
          },
        ]} />
      <DefaultHandles />
      {/* <ElementActions {...props} /> */}
    </ElementNodeContainer>
  )
}
