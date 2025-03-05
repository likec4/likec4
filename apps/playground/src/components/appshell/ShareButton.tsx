import { usePlaygroundSnapshot, usePlaygroundWorkspace } from '$hooks/usePlayground'
import { useWorkspaces } from '$hooks/useWorkspaces'
import { css } from '$styled-system/css'
import { VStack } from '$styled-system/jsx'
import { vstack } from '$styled-system/patterns'
import {
  Alert as MantineAlert,
  Button as MantineButton,
  Popover,
  Stack,
  Text,
  useMatches,
} from '@mantine/core'
import { IconShare } from '@tabler/icons-react'
import { useState } from 'react'
import { SharePlaygroundForm } from './SharePlaygroundForm'

const Button = MantineButton.withProps({
  size: 'xs',
  px: 'xs',
})

const Alert = MantineAlert.withProps({
  title: 'Playground has errors',
  color: 'red',
  radius: 'sm',
  classNames: {
    root: css({
      maxW: 400,
      padding: 'xs',
    }),
    body: css({
      gap: '1',
    }),
    label: css({
      fontSize: 'xs',
    }),
  },
})

export function ShareButton() {
  const { diagnosticErrors } = usePlaygroundSnapshot(s => ({
    diagnosticErrors: s.context.diagnosticErrors as readonly string[],
  }))
  const hasErrors = diagnosticErrors.length > 0

  const { hasChanges, isExample } = usePlaygroundWorkspace()
  const [examplePopoverOpened, setExamplePopoverOpened] = useState(false)

  const [workspaces, {
    createNewFromCurrent,
  }] = useWorkspaces()

  if (isExample) {
    return (
      <Popover
        opened={examplePopoverOpened}
        withOverlay
        overlayProps={{
          opacity: 0,
        }}
        position="bottom-start"
        withArrow
        arrowPosition="center"
        onDismiss={() => setExamplePopoverOpened(false)}
        shadow="md" //
      >
        <Popover.Target>
          <Button
            color="gray"
            variant="subtle"
            leftSection={<IconShare size={14} />}
            onClick={() => setExamplePopoverOpened(true)}>
            Share
          </Button>
        </Popover.Target>
        <Popover.Dropdown p={'sm'}>
          <Stack align="flex-start">
            <Text fz={'sm'}>You can share your own playgrounds</Text>
            <Button
              variant="filled"
              onClick={() => {
                setExamplePopoverOpened(false)
                createNewFromCurrent()
              }}>
              Copy current...
            </Button>
          </Stack>
        </Popover.Dropdown>
      </Popover>
    )
  }

  return (
    <Popover
      withOverlay
      position="bottom-start"
      withArrow
      arrowPosition="center"
      shadow="md"
      keepMounted={false}
    >
      <Popover.Target>
        <Button variant="default" leftSection={<IconShare size={14} />}>
          Share
        </Button>
      </Popover.Target>
      <Popover.Dropdown p={'md'}>
        <VStack gap={'md'} alignItems={'flex-start'}>
          {hasErrors
            ? (
              <Alert title="Playground has errors">
                {diagnosticErrors.map((e) => <Text fz={'2xs'} key={e} truncate>{e}</Text>)}
              </Alert>
            )
            : <SharePlaygroundForm />}
        </VStack>
      </Popover.Dropdown>
    </Popover>
  )
}
