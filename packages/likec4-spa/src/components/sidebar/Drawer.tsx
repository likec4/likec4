import { Button, Drawer, Group, rem, ScrollArea, SegmentedControl } from '@mantine/core'
import { useLocalStorage } from '@mantine/hooks'
import { IconArrowLeft, IconStarFilled } from '@tabler/icons-react'
import { Link, useMatches } from '@tanstack/react-router'
import { memo } from 'react'
import { DiagramsTree } from './DiagramsTree'
import { SidebarDrawerOps, useDrawerOpened } from './state'

export const SidebarDrawer = memo(() => {
  const opened = useDrawerOpened()

  const [grouping, setGrouping] = useLocalStorage({
    key: 'sidebar-drawer-grouping',
    defaultValue: 'by-files' as 'by-files' | 'by-folders' | 'none',
  })

  const isSingleProject = useMatches({
    select: (matches) => matches.some((match) => match.routeId === '/_single'),
  })

  return (
    <Drawer.Root
      keepMounted={isSingleProject}
      opened={opened}
      scrollAreaComponent={ScrollArea.Autosize}
      onClose={SidebarDrawerOps.close}>
      <Drawer.Overlay blur={2} />
      <Drawer.Content>
        <Drawer.Header>
          <Group gap={'xs'}>
            <Button
              component={Link}
              to="/"
              leftSection={<IconArrowLeft size={14} />}
              color="dimmed"
              variant="subtle"
              px={rem(5)}
              styles={{
                section: {
                  marginInlineEnd: 4,
                },
              }}
              size="xs">
              Overview
            </Button>
            <SegmentedControl
              size="xs"
              withItemsBorders={false}
              value={grouping}
              onChange={setGrouping as any}
              data={[
                { label: 'By files', value: 'by-files' },
                { label: 'By folders', value: 'by-folders' },
                { label: 'List', value: 'none' },
              ]}
            />

            <Button
              leftSection={<IconStarFilled size={12} stroke={2} />}
              color="dimmed"
              variant="subtle"
              px={rem(5)}
              styles={{
                section: {
                  marginInlineEnd: 4,
                },
              }}
              size="xs"
              renderRoot={(props) => (
                <Link
                  to="/view/$viewId"
                  params={{ viewId: 'index' }}
                  {...props}
                />
              )}>
              Open index
            </Button>
          </Group>
          <Drawer.CloseButton />
        </Drawer.Header>
        <Drawer.Body>
          <DiagramsTree groupBy={grouping} />
        </Drawer.Body>
      </Drawer.Content>
    </Drawer.Root>
  )
})
