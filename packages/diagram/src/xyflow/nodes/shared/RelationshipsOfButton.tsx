import type { Fqn } from '@likec4/core'
import { ActionIcon, Tooltip } from '@mantine/core'
import { IconTransform } from '@tabler/icons-react'
import clsx from 'clsx'
import { useDiagramStoreApi } from '../../../hooks/useDiagramState'

export const RelationshipsOfButton = ({ elementId, className }: { elementId: Fqn; className: string }) => {
  const store = useDiagramStoreApi()
  return (
    <Tooltip fz="xs" color="dark" label="Browse relationships" withinPortal={false} openDelay={400}>
      <ActionIcon
        className={clsx('nodrag nopan', className)}
        radius="md"
        onPointerDownCapture={e => e.stopPropagation()}
        onClick={event => {
          event.stopPropagation()
          store.getState().openOverlay({
            relationshipsOf: elementId
          })
        }}
        role="button"
        onDoubleClick={event => event.stopPropagation()}
      >
        <IconTransform
          stroke={2}
          style={{
            width: '72%',
            height: '72%'
          }} />
      </ActionIcon>
    </Tooltip>
  )
}
