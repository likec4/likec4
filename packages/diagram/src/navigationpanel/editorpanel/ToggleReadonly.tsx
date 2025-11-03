import { IconLockOpen2 } from '@tabler/icons-react'
import { useDiagram } from '../../hooks/useDiagram'
import { PanelActionIcon } from '../_common'
import { Tooltip } from './_common'

export const ToggleReadonly = () => {
  const diagram = useDiagram()
  return (
    <Tooltip label="Switch to Read-only">
      <PanelActionIcon onClick={() => diagram.toggleFeature('ReadOnly')}>
        <IconLockOpen2 size={14} stroke={2} />
      </PanelActionIcon>
    </Tooltip>
  )
}
