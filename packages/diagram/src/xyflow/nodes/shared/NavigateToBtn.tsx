import { ActionIcon } from '@mantine/core'
import clsx from 'clsx'
import { ZoomIn } from '../../../icons'
import { useDiagramStoreApi } from '../../../state'

export type NavigateToBtnProps = {
  xynodeId: string
  className?: string
}

export function NavigateToBtn({ xynodeId, className }: NavigateToBtnProps) {
  const diagramApi = useDiagramStoreApi()
  return (
    <ActionIcon
      className={clsx('nodrag nopan', className)}
      radius="xl"
      onClick={event => {
        diagramApi.getState().triggerOnNavigateTo(xynodeId, event)
        event.stopPropagation()
      }}
    >
      <ZoomIn />
    </ActionIcon>
  )
}
