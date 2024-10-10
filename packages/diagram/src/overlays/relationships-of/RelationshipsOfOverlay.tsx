import { type Fqn } from '@likec4/core'
import { ActionIcon, Code, Paper } from '@mantine/core'
import { IconX } from '@tabler/icons-react'
import { OverlayDialog } from '../../components'
import { useDiagramStoreApi } from '../../hooks'
import { useLikeC4Model } from '../../likec4model'
import * as css from './RelationshipsOfOverlay.css'

export function RelationshipsOfOverlay({ elementId }: { elementId: Fqn }) {
  const diagramApi = useDiagramStoreApi()
  const element = useLikeC4Model(true).element(elementId).element

  // useMountEffect(() => {
  //   dialogRef.current?.showModal()
  // })
  // const closeMe = () => {
  //   setTimeout(() => {
  //     diagramApi.setState({
  //       activeDependencyView: null
  //     })
  //   }, 400)
  // }

  return (
    <OverlayDialog
      onClose={() => {
        diagramApi.getState().closeOverlay()
      }}
    >
      {({ close }) => (
        <Paper className={css.dependencyViewContainer}>
          <div>element</div>
          <Code block>{JSON.stringify(element, null, 2)}</Code>
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
