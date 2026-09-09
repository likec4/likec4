import { IconFileSymlink } from '@tabler/icons-react'
import { useDiagram } from '../../hooks/useDiagram'
import { PanelActionIcon, Tooltip } from '../_common'

export const OpenSource = () => {
  const diagram = useDiagram()
  return (
    <Tooltip label="Open View Source">
      <PanelActionIcon
        layout="position"
        // variant="filled"
        onClick={e => {
          e.stopPropagation()
          const viewId = diagram.currentView.id
          diagram.openSource({ view: viewId })
        }}
        children={<IconFileSymlink style={{ width: '60%', height: '60%' }} />}
      />
    </Tooltip>
  )
}
