import { type Fqn, type NodeId, type ThemeColor, type ViewChange, defaultTheme, invariant } from '@likec4/core'
import { ActionIcon, Tooltip as MantineTooltip } from '@mantine/core'
import { useCallbackRef } from '@mantine/hooks'
import { IconFileSymlink, IconTransform } from '@tabler/icons-react'
import { useState } from 'react'
import { keys } from 'remeda'
import type { MergeExclusive } from 'type-fest'
import type { NodeProps } from '../../../../base'
import { useDiagramEventHandlers } from '../../../../context'
import { useDiagram } from '../../../../hooks'
import type { Types } from '../../../types'

export type OnStyleChange = (style: ViewChange.ChangeElementStyle['style']) => void

const {
  primary,
  secondary,
  muted,
  ...otherColors
} = defaultTheme.elements

export const themedColors = [
  { key: 'primary', value: primary.fill },
  { key: 'secondary', value: secondary.fill },
  { key: 'muted', value: muted.fill },
] satisfies Array<{ key: ThemeColor; value: string }>

export const colors = keys(otherColors).map(key => ({
  key,
  value: defaultTheme.elements[key].fill,
}))

export type ThemeColorKey = typeof themedColors[0]['key']
export type ColorKey = typeof colors[0]['key']

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

export function useHandlers(
  target: Fqn,
  props: NodeProps<Types.NodeData>,
) {
  const { onChange: triggerOnChange } = useDiagramEventHandlers()
  const diagram = useDiagram()

  const [originalColor, setOriginalColor] = useState<ThemeColor | null>(null)
  const onColorPreview = useCallbackRef((color: ThemeColor | null) => {
    if (color === null) {
      invariant(originalColor, 'originalColor is null')
      setOriginalColor(null)
      diagram.updateNodeData(props.id as NodeId, {
        color: originalColor,
      })
      return
    }
    setOriginalColor(value => value ?? props.data.color as ThemeColor)
    diagram.updateNodeData(props.id as NodeId, {
      color,
    })
  })

  const onChange: OnStyleChange = useCallbackRef((change) => {
    triggerOnChange?.({
      change: {
        op: 'change-element-style',
        style: change,
        targets: [target],
      },
    })
    const { shape, color, ...style } = change
    diagram.updateNodeData(props.id as NodeId, {
      ...(shape && { shape }),
      ...(color && { color }),
      style,
    })
  })

  return {
    elementColor: originalColor ?? props.data.color as ThemeColor,
    onColorPreview,
    onChange,
  }
}

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

export function GoToSourceButton(props: MergeExclusive<{ elementId: Fqn }, { deploymentId: Fqn }>) {
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
