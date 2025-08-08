import { Box } from '@likec4/styles/jsx'
import { Button, Code, Group, Notification, ScrollAreaAutosize } from '@mantine/core'
import { IconX } from '@tabler/icons-react'
import {
  type ErrorBoundaryProps,
  type FallbackProps,
  ErrorBoundary as ErrorBoundaryComponent,
} from 'react-error-boundary'

export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const errorString = error instanceof Error ? error.message : 'Unknown error'
  return (
    <Box pos={'fixed'} top={'0'} left={'0'} w={'100%'} p={'0'} style={{ zIndex: 1000 }}>
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
    </Box>
  )
}

export function ErrorBoundary(props: Pick<ErrorBoundaryProps, 'onReset' | 'onError' | 'children'>) {
  return (
    <ErrorBoundaryComponent
      FallbackComponent={ErrorFallback}
      onError={(err, info) => {
        console.error(err, info)
      }}
      {...props} />
  )
}
