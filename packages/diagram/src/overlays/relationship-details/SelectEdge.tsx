import { type DiagramEdge, type DiagramView } from '@likec4/core'
import {
  Box,
  Button,
  Popover,
  PopoverDropdown,
  PopoverTarget,
  ScrollAreaAutosize,
  Text,
  ThemeIcon,
  useComputedColorScheme,
} from '@mantine/core'
import { IconArrowRight, IconSelector } from '@tabler/icons-react'
import { useRef } from 'react'
import { useMantinePortalProps } from '../../hooks'
import { useRelationshipDetails } from './hooks'
import * as css from './SelectEdge.css'

export const SelectEdge = ({
  edge,
  view,
}: {
  edge: DiagramEdge
  view: DiagramView
  // onSelect: (id: Fqn) => void
}) => {
  const browser = useRelationshipDetails()
  const viewport = useRef<HTMLDivElement>(null)
  const portalProps = useMantinePortalProps()
  // const data = useLikeC4ElementsTree(scope === 'view' ? viewId : undefined)
  // const tree = useTree({
  //   multiple: false
  // })

  // useEffect(() => {
  //   ancestorsFqn(subject.id).reverse().forEach(id => {
  //     tree.expand(id)
  //   })
  //   tree.select(subject.id)
  // }, [subject.id])

  const theme = useComputedColorScheme()

  const edgeSource = view.nodes.find(n => n.id === edge.source)
  const edgeTarget = view.nodes.find(n => n.id === edge.target)

  const edges = view.edges.flatMap(edge => {
    const source = view.nodes.find(n => n.id === edge.source)
    const target = view.nodes.find(n => n.id === edge.target)
    if (source && target) {
      return {
        id: edge.id,
        source,
        target,
        label: edge.label,
      }
    }
    return []
  })

  if (!edgeSource || !edgeTarget || edges.length === 0) {
    return null
  }

  return (
    <Popover
      position="bottom-start"
      shadow="md"
      keepMounted
      withinPortal={false}
      closeOnClickOutside
      clickOutsideEvents={['pointerdown', 'mousedown', 'click']}
      onOpen={() => {
        setTimeout(() => {
          const item = viewport.current?.querySelector(`[data-edge-id="${edge.id}"]`)
          item?.scrollIntoView({ behavior: 'instant', block: 'nearest' })
        }, 100)
      }}
    >
      <PopoverTarget>
        <Button
          size="xs"
          variant="default"
          fw={'500'}
          style={{ padding: '0.25rem 0.75rem' }}
          rightSection={<IconSelector size={16} />}
        >
          <Box
            className={css.edgeSource}
            maw={160}
            p={0}
            mod={{
              'likec4-color': edgeSource.color,
            }}
          >
            <Text component="span" truncate>{edgeSource.title}</Text>
          </Box>
          <ThemeIcon color="dark" variant="transparent" size={'xs'}>
            <IconArrowRight style={{ width: '80%' }} />
          </ThemeIcon>
          <Box
            className={css.edgeTarget}
            maw={160}
            p={0}
            mod={{
              'likec4-color': edgeTarget.color,
            }}
          >
            <Text component="span" truncate>{edgeTarget.title}</Text>
          </Box>
        </Button>
      </PopoverTarget>
      <PopoverDropdown p={0} miw={250} maw={400}>
        <ScrollAreaAutosize className={css.scrollArea} scrollbars="y" type="never" viewportRef={viewport}>
          <Box className={css.edgeGrid} p="xs" maw={400}>
            {edges.map(e => (
              <div
                key={e.id}
                className={css.edgeRow}
                data-selected={e.id === edge.id}
                onClick={event => {
                  event.stopPropagation()
                  browser.navigateTo(e.id)
                }}>
                <Box
                  className={css.edgeSource}
                  mod={{
                    'edge-id': e.id,
                    'likec4-color': e.source.color,
                  }}
                >
                  <Text component="span" truncate>{e.source.title}</Text>
                </Box>
                <Box className={css.edgeArrow}>
                  <ThemeIcon color="dark" variant="transparent" size={'xs'}>
                    <IconArrowRight style={{ width: '80%' }} />
                  </ThemeIcon>
                </Box>
                <Box
                  className={css.edgeTarget}
                  mod={{
                    'likec4-color': e.target.color,
                  }}
                >
                  <Text component="span" truncate>{e.target.title}</Text>
                </Box>
                <Box className={css.edgeLabel}>
                  <Text component="span" truncate>{e.label || 'untitled'}</Text>
                </Box>
              </div>
            ))}
          </Box>
        </ScrollAreaAutosize>
      </PopoverDropdown>
    </Popover>
  )
}
