import { Alert, Button, Code, Container, Group, Text } from '@mantine/core'
import { isNotFound, useParams, useRouter } from '@tanstack/react-router'
import type { FallbackProps } from 'react-error-boundary'
import { isError, isNullish, isObjectType } from 'remeda'

export function Fallback({ error: _error, resetErrorBoundary }: FallbackProps) {
  const router = useRouter()
  const params = useParams({
    strict: false,
  })
  if (isNotFound(_error)) {
    return (
      <Container my={'md'}>
        <Alert variant="light" color="orange">
          <Text c={'orange'} fz={'md'}>
            The diagram{' '}
            <Code color="orange">
              {params.viewId ?? 'unknown'}
            </Code>{' '}
            does not exist or contains errors
          </Text>
          <Button
            onClick={() => {
              resetErrorBoundary()
              void router.navigate({
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
  const error = _error as any
  let message = 'Unknown error'
  try {
    switch (true) {
      case isNullish(error):
        message = 'Unknown error'
        break
      case isError(error):
        message = error.stack ?? error.message
        break
      case typeof error === 'string':
        message = error
        break
      case isObjectType(error):
        message = error['stack'] ?? error['message'] ?? `${error}`
        break
      default:
        message = `${error}`
        break
    }
  } catch (e) {
    message = `${e}`
  }
  return (
    <Container my={'md'}>
      <Alert variant="filled" color="red" title={'Something went wrong'}>
        <Code block color="red">
          {message}
        </Code>
        <Group mt={'lg'}>
          <Button
            onClick={() => {
              void router.invalidate().finally(() => {
                resetErrorBoundary()
              })
            }}
            color="red"
            variant="white"
            size="xs">
            Try again
          </Button>
          <Button
            onClick={() => {
              resetErrorBoundary()
              void router.navigate({ to: '/' })
            }}
            color="red"
            size="xs">
            Go to overview
          </Button>
        </Group>
      </Alert>
    </Container>
  )
}
