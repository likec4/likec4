import type { DeploymentFqn, Fqn } from '@likec4/core/types'
import { ActionIcon, Tooltip as MantineTooltip } from '@mantine/core'
import { IconFileSymlink, IconTransform } from '@tabler/icons-react'
import type { MergeExclusive } from 'type-fest'
import { useDiagramEventHandlers } from '../../../../context'
import { useDiagram } from '../../../../hooks/useDiagram'

export const Tooltip = MantineTooltip.withProps({
  color: 'dark',
  fz: 'xs',
  openDelay: 400,
  closeDelay: 150,
  label: '',
  children: null,
  offset: 4,
  withinPortal: false,
})

export function BrowseRelationshipsButton({ fqn }: { fqn: Fqn }) {
  const diagram = useDiagram()
  return (
    <Tooltip label={'Browse relationships'}>
      <ActionIcon
        size={'sm'}
        variant="subtle"
        color="gray"
        onClick={e => {
          e.stopPropagation()
          diagram.openRelationshipsBrowser(fqn)
        }}>
        <IconTransform
          stroke={2}
          style={{
            width: '72%',
            height: '72%',
          }} />
      </ActionIcon>
    </Tooltip>
  )
}

export function GoToSourceButton(props: MergeExclusive<{ elementId: Fqn }, { deploymentId: DeploymentFqn }>) {
  const { onOpenSource } = useDiagramEventHandlers()
  if (!onOpenSource) return null
  // const diagramApi = useDiagramStoreApi()
  // const portalProps = useMantinePortalProps()
  return (
    <Tooltip label={'Open source'}>
      <ActionIcon
        size={'sm'}
        variant="subtle"
        color="gray"
        onClick={e => {
          e.stopPropagation()
          if (props.elementId) {
            onOpenSource?.({
              element: props.elementId,
            })
          } else if (props.deploymentId) {
            onOpenSource?.({
              deployment: props.deploymentId,
            })
          }
        }}>
        <IconFileSymlink stroke={1.8} style={{ width: '70%' }} />
      </ActionIcon>
    </Tooltip>
  )
}
