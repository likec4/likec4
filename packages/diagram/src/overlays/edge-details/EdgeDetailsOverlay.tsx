import { type EdgeId, invariant } from '@likec4/core'
import { ActionIcon, Code, Paper } from '@mantine/core'
import { IconX } from '@tabler/icons-react'
import { OverlayDialog } from '../../components'
import { useDiagramState, useDiagramStoreApi } from '../../hooks'
import * as css from './EdgeDetailsOverlay.css'

export function EdgeDetailsOverlay({ edgeId }: { edgeId: EdgeId }) {
  const diagramApi = useDiagramStoreApi()
  const edge = useDiagramState(s => s.xyedges.find(e => e.id === edgeId))
  invariant(edge, `Edge with id ${edgeId} not found`)
  return (
    <OverlayDialog
      onClose={() => {
        diagramApi.getState().closeOverlay()
      }}
      data-likec4-color="gray"
    >
      {({ close }) => (
        <Paper className={css.dependencyViewContainer}>
          <div>edge</div>
          <Code block>{JSON.stringify(edge, null, 2)}</Code>
          <ActionIcon
            variant="default"
            color="gray"
            autoFocus
            onClick={(e) => {
              e.stopPropagation()
              close()
            }}>
            <IconX />
          </ActionIcon>
        </Paper>
      )}
    </OverlayDialog>
  )
}
