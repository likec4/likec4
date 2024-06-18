import { ActionIcon } from '@mantine/core'
import { IconZoomScan } from '@tabler/icons-react'
import clsx from 'clsx'
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
      radius="md"
      onPointerDownCapture={e => e.stopPropagation()}
      onClick={event => {
        event.stopPropagation()
        diagramApi.getState().triggerOnNavigateTo(xynodeId, event)
      }}
      onDoubleClick={event => event.stopPropagation()}
    >
      <IconZoomScan
        style={{
          width: '75%',
          height: '75%'
        }} />
    </ActionIcon>
  )
}
