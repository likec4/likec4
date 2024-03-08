import { Button, ButtonGroup, Drawer as MantineDrawer, ScrollArea } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { ArrowLeftIcon } from '@radix-ui/react-icons'
import { Theme as RadixTheme } from '@radix-ui/themes'
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
          startTransition
          leftSection={<ArrowLeftIcon />}
          color="dimmed"
          variant="subtle"
          size="xs">
          Back to overview
        </Button>
      }
      scrollAreaComponent={ScrollArea.Autosize}>
      <RadixTheme isRoot={false}>
        <DiagramsTree />
      </RadixTheme>
    </MantineDrawer>
  )
}
