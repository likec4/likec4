import { ReactFlowProvider as XYFlowProvider } from '@xyflow/react'
import { memo } from 'react'
import { OverlayDialog, OverlayDialogCloseButton } from '../../components'
import { useDiagramStoreApi } from '../../hooks'
import { RelationshipsXYFlow } from './RelationshipsXYFlow'
import * as css from './styles.css'

export const RelationshipsOfOverlay = memo(() => {
  const diagramApi = useDiagramStoreApi()

  return (
    <OverlayDialog
      className={css.overlay}
      onClose={() => {
        diagramApi.getState().closeOverlay()
      }}
      data-likec4-color="gray"
    >
      {
        ({ opened }) =>
          <>
            {opened && (
              <XYFlowProvider
                defaultNodes={[]}
                defaultEdges={[]}>
                <RelationshipsXYFlow />
              </XYFlowProvider>
            )}
            <OverlayDialogCloseButton />
          </>

        // <Paper className={css.dependencyViewContainer}>
        //   <div>element</div>
        //   <Code block>{JSON.stringify(element, null, 2)}</Code>
        //   <ActionIcon
        //     variant="default"
        //     color="gray"
        //     autoFocus
        //     onClick={(e) => {
        //       e.stopPropagation()
        //       close()
        //     }}>
        //     <IconX />
        //   </ActionIcon>
        // </Paper>
      }
    </OverlayDialog>
  )
})
