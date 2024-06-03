import { Button, Drawer as MantineDrawer, ScrollArea } from '@mantine/core'
import { IconArrowLeft } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { DiagramsTree } from './DiagramsTree'

type SidebarDrawerProps = {
  opened: boolean
  onClose: () => void
}
export function SidebarDrawer({ opened, onClose }: SidebarDrawerProps) {
  return (
    <MantineDrawer
      size={'sm'}
      opened={opened}
      onClose={onClose}
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
