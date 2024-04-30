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
      autoFocus={false}
      onClick={(event) => {
        event.stopPropagation()
        event.preventDefault()
        diagramApi.getState().triggerOnNavigateTo(xynodeId, event)
      }}
    >
      <ZoomIn />
    </ActionIcon>
  )
}
