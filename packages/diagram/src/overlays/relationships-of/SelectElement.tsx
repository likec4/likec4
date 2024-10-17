import { ancestorsFqn, type Element, type Fqn, type ViewID } from '@likec4/core'
import {
  ActionIcon,
  Box,
  Button,
  Group,
  Popover,
  PopoverDropdown,
  PopoverTarget,
  ScrollAreaAutosize,
  Text,
  Tree,
  useComputedColorScheme,
  useTree
} from '@mantine/core'
import { IconChevronRight, IconSelector } from '@tabler/icons-react'
import { useEffect, useRef } from 'react'
import { useLikeC4ElementsTree } from '../../likec4model'
import * as classes from './SelectElement.css'

export const SelectElement = ({
  subject,
  viewId,
  scope,
  onSelect
}: {
  subject: Element
  viewId: ViewID
  scope: 'global' | 'view'
  onSelect: (id: Fqn) => void
}) => {
  const viewport = useRef<HTMLDivElement>(null)
  const data = useLikeC4ElementsTree(scope === 'view' ? viewId : undefined)
  const tree = useTree({
    multiple: false
  })

  useEffect(() => {
    ancestorsFqn(subject.id).reverse().forEach(id => {
      tree.expand(id)
    })
    tree.select(subject.id)
  }, [subject.id])

  const theme = useComputedColorScheme()

  return (
    <Popover
      position="bottom"
      shadow="md"
      keepMounted
      withinPortal={false}
      closeOnClickOutside
      clickOutsideEvents={['pointerdown', 'mousedown', 'click']}
      onOpen={() => {
        setTimeout(() => {
          const item = viewport.current?.querySelector(`[data-value="${subject.id}"]`)
          console.log('item', item)
          item?.scrollIntoView({ behavior: 'instant', block: 'nearest' })
        }, 100)
      }}
    >
      <PopoverTarget>
        <Button
          size="xs"
          variant="light"
          color={theme === 'light' ? 'dark' : 'gray'}
          fw={'500'}
          maw={250}
          style={{ padding: '0.25rem 0.75rem' }}
          rightSection={<IconSelector size={16} />}
        >
          {subject.title}
        </Button>
      </PopoverTarget>
      <PopoverDropdown p={0} miw={250} maw={400}>
        <ScrollAreaAutosize mah={'70vh'} scrollbars="y" type="never" viewportRef={viewport}>
          <Tree
            allowRangeSelection={false}
            selectOnClick={false}
            tree={tree}
            data={data}
            classNames={classes}
            levelOffset={8}
            styles={{
              label: {
                paddingTop: 5,
                paddingBottom: 6
              }
            }}
            renderNode={({ node, selected, expanded, elementProps, hasChildren }) => (
              <Group gap={2} wrap="nowrap" {...elementProps} py="3">
                <ActionIcon
                  variant="subtle"
                  size={18}
                  // color={theme === 'light' ? 'gray' : 'gray'}
                  c={'dimmed'}
                  style={{
                    visibility: hasChildren ? 'visible' : 'hidden'
                  }}>
                  <IconChevronRight
                    stroke={3.5}
                    style={{
                      transition: 'transform 150ms ease',
                      transform: `rotate(${expanded ? '90deg' : '0'})`,
                      width: '80%'
                    }} />
                </ActionIcon>
                <Box
                  flex={'1 1 100%'}
                  w={'100%'}
                  // gap={3}
                  onClick={e => {
                    e.stopPropagation()
                    onSelect(node.value as Fqn)
                    tree.select(node.value)
                    tree.expand(node.value)
                  }}>
                  <Text
                    fz="sm"
                    fw={selected ? '600' : '400'}
                    truncate="end">
                    {node.label}
                  </Text>
                </Box>
                {
                  /* <Button
                  fullWidth
                  color={theme === 'light' ? 'dark' : 'gray'}
                  variant={selected ? 'transparent' : 'subtle'}
                  size="sm"
                  fz={'sm'}
                  fw={'500'}
                  justify="flex-start"
                  leftSection={hasChildren ? (expanded ? <IconArrowDown /> : <IconArrowRight />) : null}
                >
                  {node.label}
                </Button> */
                }
              </Group>
            )}
          />
        </ScrollAreaAutosize>
      </PopoverDropdown>
    </Popover>
  )
}