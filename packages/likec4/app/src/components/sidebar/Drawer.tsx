import { Button, Drawer, Group, ScrollArea, SegmentedControl } from '@mantine/core'
import { useLocalStorage } from '@mantine/hooks'
import { IconArrowLeft } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { DiagramsTree } from './DiagramsTree'
import { SidebarDrawerOps, useDrawerOpened } from './state'

export function SidebarDrawer() {
  const opened = useDrawerOpened()

  const [grouping, setGrouping] = useLocalStorage({
    key: 'sidebar-drawer-grouping',
    defaultValue: 'by-files' as 'by-files' | 'by-folders' | 'none'
  })

  return (
    <Drawer.Root
      keepMounted
      opened={opened}
      scrollAreaComponent={ScrollArea.Autosize}
      onClose={SidebarDrawerOps.close}>
      <Drawer.Overlay />
      <Drawer.Content>
        <Drawer.Header>
          <Group>
            <Button
              component={Link}
              to="/"
              leftSection={<IconArrowLeft size={16} />}
              color="dimmed"
              variant="subtle"
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
                { label: 'None', value: 'none' }
              ]}
            />
          </Group>
          <Drawer.CloseButton />
        </Drawer.Header>
        <Drawer.Body>
          <DiagramsTree groupBy={grouping} />
        </Drawer.Body>
      </Drawer.Content>
    </Drawer.Root>
    // <MantineDrawer
    //   size={'sm'}
    //   opened={opened}
    //   keepMounted
    //   onClose={() => drawerOpenedAtom.set(false)}
    //   title={

    //   }
    //   scrollAreaComponent={ScrollArea.Autosize}>
    //   <DiagramsTree />
    // </MantineDrawer>
  )
}
