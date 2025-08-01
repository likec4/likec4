import { IconFileSymlink } from '@tabler/icons-react'
import { useDiagramEventHandlers } from '../../context/DiagramEventHandlers'
import { useEnabledFeatures } from '../../context/DiagramFeatures'
import { useCurrentViewId } from '../../hooks/useCurrentViewId'
import { PanelActionIcon, Tooltip } from '../_common'

export const OpenSource = () => {
  const viewId = useCurrentViewId()
  const { enableVscode } = useEnabledFeatures()
  const { onOpenSource } = useDiagramEventHandlers()

  if (!enableVscode) {
    return null
  }

  return (
    <Tooltip label="Open View Source">
      <PanelActionIcon
        // variant="filled"
        onClick={e => {
          e.stopPropagation()
          onOpenSource?.({ view: viewId })
        }}
        children={<IconFileSymlink size={12} stroke={1.5} style={{ width: '65%' }} />}
      />
    </Tooltip>
  )
}
