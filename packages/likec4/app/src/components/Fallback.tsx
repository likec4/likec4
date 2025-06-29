import { Alert, Button, Code, Container, Group, Text } from '@mantine/core'
import { isNotFound, useRouter, useSearch } from '@tanstack/react-router'
import type { FallbackProps } from 'react-error-boundary'

export function Fallback({ error, resetErrorBoundary }: FallbackProps) {
  const router = useRouter()
  if (isNotFound(error)) {
    return (
      <Container my={'md'}>
        <Alert variant="light" color="orange">
          <Text c={'orange'} fz={'md'}>
            The diagram{' '}
            <Code color="orange">
              {/* {viewId} */}
            </Code>{' '}
            does not exist or contains errors
          </Text>
          <Button
            onClick={() => {
              resetErrorBoundary()
              router.navigate({
                to: '/',
              })
            }}
            variant="light"
            color="orange"
            mt={'lg'}
            size="xs">
            Go to overview
          </Button>
        </Alert>
      </Container>
    )
  }
  return (
    <Container my={'md'}>
      <Alert variant="filled" color="red" title={'Something went wrong'}>
        <Code block color="red">
          {error.stack ?? error.message}
        </Code>
        <Group mt={'lg'}>
          <Button onClick={resetErrorBoundary} color="red" variant="white" size="xs">
            Try again
          </Button>
          <Button onClick={() => router.navigate({ to: '/' })} color="red" size="xs">
            Go to overview
          </Button>
        </Group>
      </Alert>
    </Container>
  )
}
