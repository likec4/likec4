import { IconFocusCentered } from '@tabler/icons-react'
import { useDiagram } from '../../hooks/useDiagram'
import { PanelActionIcon } from '../_common'
import { Tooltip } from './_common'

export const CenterCamera = () => {
  const diagram = useDiagram()
  return (
    <Tooltip label="Center camera">
      <PanelActionIcon onClick={() => diagram.fitDiagram()}>
        <IconFocusCentered />
      </PanelActionIcon>
    </Tooltip>
  )
}
