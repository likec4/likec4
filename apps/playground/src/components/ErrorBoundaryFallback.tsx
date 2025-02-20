import { Button, Code, Group, Notification, Paper, ScrollAreaAutosize } from '@mantine/core'
import { IconX } from '@tabler/icons-react'
import type { FallbackProps } from 'react-error-boundary'

export function ErrorBoundaryFallback({ error, resetErrorBoundary }: FallbackProps) {
  const errorString = error instanceof Error ? error.message : 'Unknown error'
  return (
    <Paper withBorder p="lg" m="lg">
      <Notification
        icon={<IconX style={{ width: 16, height: 16 }} />}
        styles={{
          icon: {
            alignSelf: 'flex-start',
          },
        }}
        color={'red'}
        title={'Oops, something went wrong'}
        p={'xl'}
        withCloseButton={false}>
        <ScrollAreaAutosize maw={'100%'} mah={400}>
          <Code block>{errorString}</Code>
        </ScrollAreaAutosize>
        <Group gap={'xs'} mt="xl">
          <Button color="gray" size="xs" variant="light" onClick={() => resetErrorBoundary()}>Reset</Button>
        </Group>
      </Notification>
    </Paper>
  )
}
