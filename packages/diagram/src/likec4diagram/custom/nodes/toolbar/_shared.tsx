import type { BorderStyle, DeploymentFqn, Fqn } from '@likec4/core/types'
import { ActionIcon, SegmentedControl, Tooltip as MantineTooltip } from '@mantine/core'
import { IconFileSymlink, IconTransform } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import type { MergeExclusive } from 'type-fest'
import { useDiagramEventHandlers } from '../../../../context'
import { useDiagram } from '../../../../hooks/useDiagram'
import type { OnStyleChange } from './types'

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
        size={'md'}
        variant="subtle"
        color="gray"
        onClick={e => {
          e.stopPropagation()
          diagram.openRelationshipsBrowser(fqn)
        }}>
        <IconTransform
          stroke={2}
          style={{
            width: '65%',
            height: '65%',
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
        size={'md'}
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
        <IconFileSymlink stroke={1.8} style={{ width: '65%' }} />
      </ActionIcon>
    </Tooltip>
  )
}

export function BorderStyleOption({
  elementBorderStyle = 'none',
  onChange,
}: {
  elementBorderStyle: BorderStyle | undefined
  onChange: OnStyleChange
}) {
  const [value, setValue] = useState(elementBorderStyle)
  useEffect(() => {
    setValue(elementBorderStyle)
  }, [elementBorderStyle])

  return (
    <SegmentedControl
      size="xs"
      fz={9}
      fullWidth
      withItemsBorders={false}
      value={value}
      onChange={v => {
        const border = v as BorderStyle
        setValue(border)
        onChange({ border })
      }}
      styles={{
        label: {
          paddingTop: 2,
          paddingBottom: 2,
        },
      }}
      data={[
        { label: 'Solid', value: 'solid' },
        { label: 'Dashed', value: 'dashed' },
        { label: 'Dotted', value: 'dotted' },
        { label: 'None', value: 'none' },
      ]}
    />
  )
}
