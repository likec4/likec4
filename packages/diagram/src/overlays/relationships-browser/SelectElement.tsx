import { type Fqn, ancestorsFqn } from '@likec4/core'
import {
  ActionIcon,
  Box,
  Button,
  Group,
  Popover,
  PopoverDropdown,
  PopoverTarget,
  ScrollAreaAutosize,
  SegmentedControl,
  Text,
  Tooltip,
  Tree,
  useTree,
} from '@mantine/core'
import { IconChevronRight, IconSelector } from '@tabler/icons-react'
import { memo, useEffect, useRef } from 'react'
import { useLikeC4ElementsTree, useLikeC4Model } from '../../likec4model'
import type { RelationshipsBrowserSnapshot } from './actor'
import { useRelationshipsBrowser, useRelationshipsBrowserState } from './hooks'
import * as classes from './SelectElement.css'

const selector2 = (state: RelationshipsBrowserSnapshot) => {
  const subjectExistsInScope = state.context.layouted?.subjectExistsInScope ?? false
  return ({
    subjectId: state.context.subject,
    viewId: state.context.viewId,
    scope: state.context.scope,
    subjectExistsInScope,
    enableSelectSubject: state.context.enableSelectSubject,
    enableChangeScope: state.context.enableChangeScope,
  })
}

const setHoveredNode = () => {}
export const SelectElement = memo(() => {
  const browser = useRelationshipsBrowser()
  const {
    subjectId,
    viewId,
    scope,
    subjectExistsInScope,
    enableSelectSubject,
    enableChangeScope,
  } = useRelationshipsBrowserState(selector2)

  const root = useRef<HTMLDivElement>(null)
  const viewport = useRef<HTMLDivElement>(null)
  const model = useLikeC4Model(true)
  const subject = model.findElement(subjectId)
  const data = useLikeC4ElementsTree(scope === 'view' && viewId ? viewId : undefined)
  const tree = useTree({
    multiple: false,
  })
  tree.setHoveredNode = setHoveredNode

  useEffect(() => {
    ancestorsFqn(subjectId).reverse().forEach(id => {
      tree.expand(id)
    })
    tree.select(subjectId)
  }, [subjectId])

  return (
    <Group ref={root} gap={'xs'} pos={'relative'}>
      {enableSelectSubject && (
        <Group gap={4} wrap="nowrap">
          <Box
            fz={'xs'}
            fw={'500'}
            style={{ whiteSpace: 'nowrap', userSelect: 'none' }}>
            Relationships of
          </Box>
          <Box pos={'relative'}>
            <Popover
              position="bottom-start"
              shadow="md"
              keepMounted={false}
              withinPortal={false}
              closeOnClickOutside
              clickOutsideEvents={['pointerdown', 'mousedown', 'click']}
              offset={4}
              onOpen={() => {
                setTimeout(() => {
                  const item = viewport.current?.querySelector(`[data-value="${subjectId}"]`)
                  item?.scrollIntoView({ behavior: 'instant', block: 'nearest' })
                }, 100)
              }}
            >
              <PopoverTarget>
                <Button
                  size="xs"
                  variant="default"
                  maw={250}
                  rightSection={<IconSelector size={16} />}
                >
                  <Text fz={'xs'} fw={'500'} truncate>
                    {subject?.title ?? '???'}
                  </Text>
                </Button>
              </PopoverTarget>
              <PopoverDropdown p={0} miw={250} maw={400}>
                <ScrollAreaAutosize scrollbars="y" type="never" viewportRef={viewport} className={classes.scrollArea}>
                  <Tree
                    allowRangeSelection={false}
                    selectOnClick={false}
                    tree={tree}
                    data={data}
                    classNames={classes}
                    levelOffset={8}
                    styles={{
                      root: {
                        maxWidth: 400,
                        overflow: 'hidden',
                      },
                      label: {
                        paddingTop: 5,
                        paddingBottom: 6,
                      },
                    }}
                    renderNode={({ node, selected, expanded, elementProps, hasChildren }) => (
                      <Group gap={2} wrap="nowrap" {...elementProps} py="3">
                        <ActionIcon
                          variant="subtle"
                          size={18}
                          // color={theme === 'light' ? 'gray' : 'gray'}
                          c={'dimmed'}
                          style={{
                            visibility: hasChildren ? 'visible' : 'hidden',
                          }}>
                          <IconChevronRight
                            stroke={3.5}
                            style={{
                              transition: 'transform 150ms ease',
                              transform: `rotate(${expanded ? '90deg' : '0'})`,
                              width: '80%',
                            }} />
                        </ActionIcon>
                        <Box
                          flex={'1 1 100%'}
                          w={'100%'}
                          // gap={3}
                          onClick={e => {
                            e.stopPropagation()
                            tree.select(node.value)
                            tree.expand(node.value)
                            browser.navigateTo(node.value as Fqn)
                          }}>
                          <Text
                            fz="sm"
                            fw={selected ? '600' : '400'}
                            truncate="end">
                            {node.label}
                          </Text>
                        </Box>
                      </Group>
                    )}
                  />
                </ScrollAreaAutosize>
              </PopoverDropdown>
            </Popover>
          </Box>
        </Group>
      )}
      {enableChangeScope && (
        <Group gap={4} wrap="nowrap">
          {/* Show if only "select" is enabled  */}
          {enableSelectSubject && (
            <Box
              fz={'xs'}
              fw={'500'}
              {...!subjectExistsInScope && {
                c: 'dimmed',
              }}
              style={{ whiteSpace: 'nowrap', userSelect: 'none' }}>
              Scope
            </Box>
          )}
          <div>
            <Tooltip
              color="orange"
              label={
                <>
                  This element does not exist in the current view
                  {scope === 'view' && (
                    <>
                      <br />
                      {'Scope is set to global'}
                    </>
                  )}
                </>
              }
              position="bottom-start"
              disabled={subjectExistsInScope}
              portalProps={{
                target: root.current!,
              }}
            >
              <SegmentedControl
                flex={'1 0 auto'}
                size="xs"
                withItemsBorders={false}
                value={scope}
                styles={{
                  label: {
                    paddingLeft: 8,
                    paddingRight: 8,
                  },
                }}
                onChange={value => {
                  browser.changeScope(value as 'global' | 'view')
                }}
                data={[
                  { label: 'Global', value: 'global' },
                  {
                    label: <span>Current view</span>,
                    value: 'view',
                    disabled: !subjectExistsInScope,
                  },
                ]}
              />
            </Tooltip>
          </div>
        </Group>
      )}
    </Group>
  )
})
