import { Button, Drawer as MantineDrawer, ScrollArea } from '@mantine/core'
import { useStore } from '@nanostores/react'
import { IconArrowLeft } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { atom, onMount } from 'nanostores'
import { DiagramsTree } from './DiagramsTree'

const drawerOpenedAtom = atom(false)

onMount(drawerOpenedAtom, () => {
  drawerOpenedAtom.set(false)
})

export const SidebarDrawerOps = {
  open: () => drawerOpenedAtom.set(true),
  close: () => drawerOpenedAtom.set(false)
}

export function SidebarDrawer() {
  const opened = useStore(drawerOpenedAtom)

  return (
    <MantineDrawer
      size={'sm'}
      opened={opened}
      keepMounted
      onClose={() => drawerOpenedAtom.set(false)}
      title={
        <Button
          component={Link}
          to="/"
          leftSection={<IconArrowLeft />}
          color="dimmed"
          variant="subtle"
          size="xs">
          Back to overview
        </Button>
      }
      scrollAreaComponent={ScrollArea.Autosize}>
      <DiagramsTree />
    </MantineDrawer>
  )
}
