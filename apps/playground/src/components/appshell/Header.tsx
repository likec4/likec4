import { useWorkspaceIdFromRoute } from '$hooks/useWorkspaceIdFromRoute'
import {
  Anchor,
  Button,
  Group,
} from '@mantine/core'
import { MatchRoute } from '@tanstack/react-router'
import { ColorSchemeToggle } from '../ColorSchemeToggle'
import { Logo } from '../Logo'
import { PlaygroundsMenu } from './PlaygroundsMenu'
import { PlaygroundTitle } from './PlaygroundTitle'
import { ShareButton } from './ShareButton'
import { UserButton } from './UserButton'

export function Header() {
  const workspaceId = useWorkspaceIdFromRoute()
  return (
    <Group h="100%" px="md" justify="space-between" align="stretch">
      <Group gap={'lg'} align="center" visibleFrom="sm">
        <Anchor href="https://likec4.dev/" target="_blank" display="contents">
          <Logo
            style={{
              height: 22,
            }} />
        </Anchor>
        {workspaceId && <PlaygroundTitle />}
      </Group>
      <Group h="100%" gap={'xs'}>
        {workspaceId && <ShareButton />}
        <PlaygroundsMenu />
        <Button
          component="a"
          href="https://likec4.dev/tutorial/"
          target="_blank"
          variant="subtle"
          px={'xs'}
          size="xs"
          visibleFrom="sm"
          color="gray">
          Docs
        </Button>
        <Button
          component="a"
          href="https://github.com/likec4/likec4"
          target="_blank"
          variant="subtle"
          px={'xs'}
          size="xs"
          visibleFrom="md"
          color="gray">
          GitHub
        </Button>
        <ColorSchemeToggle />
        <UserButton />
      </Group>
    </Group>
  )
}
