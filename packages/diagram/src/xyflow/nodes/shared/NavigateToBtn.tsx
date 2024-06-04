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
      onPointerDownCapture={e => e.stopPropagation()}
      onClick={event => {
        event.stopPropagation()
        diagramApi.getState().triggerOnNavigateTo(xynodeId, event)
      }}
      onDoubleClick={event => event.stopPropagation()}
    >
      <ZoomIn />
    </ActionIcon>
  )
}
