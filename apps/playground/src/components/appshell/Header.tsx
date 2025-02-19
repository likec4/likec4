import { usePlaygroundWorkspace } from '$/hooks/usePlayground'
import {
  Anchor,
  Box,
  Button,
  Group,
} from '@mantine/core'
import { ColorSchemeToggle } from '../ColorSchemeToggle'
import { Logo } from '../Logo'
import { PlaygroundsMenu } from './PlaygroundsMenu'

export function Header() {
  const { workspaceTitle } = usePlaygroundWorkspace()
  return (
    <Group h="100%" px="md" justify="space-between" align="stretch">
      <Group gap={'lg'} align="center" visibleFrom="sm">
        <Anchor href="https://likec4.dev/" target="_blank" display="contents">
          <Logo
            style={{
              height: 22,
            }} />
        </Anchor>
        <Box fz={'sm'} fw={500} visibleFrom="md">{workspaceTitle}</Box>
      </Group>

      <Group h="100%" gap={4}>
        <PlaygroundsMenu />
        <Button
          component="a"
          href="https://likec4.dev/tutorial/"
          target="_blank"
          variant="subtle"
          px={'xs'}
          size="xs"
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
      </Group>
    </Group>
  )
}
