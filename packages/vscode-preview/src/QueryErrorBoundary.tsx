import { Box, Button, Group, Notification, ScrollAreaAutosize, Stack, Text } from '@mantine/core'
import { QueryErrorResetBoundary } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'
import { type FallbackProps, ErrorBoundary } from 'react-error-boundary'
import { isError, isNullish, isObjectType } from 'remeda'
import { stateAlert } from './App.css'
import { ExtensionApi as extensionApi } from './vscode'

export const ErrorMessage = ({ error, onReset }: { error: Error | string | null; onReset?: () => void }) => {
  return <Fallback error={error} resetErrorBoundary={onReset ?? extensionApi.closeMe} />
}

const Fallback = ({ error: _error, resetErrorBoundary }: FallbackProps) => {
  console.error(`ErrorBoundary: ${_error}`, { _error })
  let message = 'Unknown error, check the console for more details'
  const error = _error as any
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
    <Box className={stateAlert}>
      <Notification
        styles={{
          icon: {
            alignSelf: 'flex-start',
          },
        }}
        color={'red'}
        title={'Oops, something went wrong'}
        withCloseButton={false}>
        <Stack gap={'xs'}>
          <ScrollAreaAutosize
            type="auto"
            maw={'calc(100vw - 150px)'}
            mah={'calc(100vh - 120px)'}
            offsetScrollbars="present"
          >
            <Text
              ff="monospace"
              component="div"
              style={{ whiteSpace: message.includes('\n') ? 'pre' : 'normal' }}
              my="xs"
              fz={'sm'}>
              {message}
            </Text>
          </ScrollAreaAutosize>
          <Group gap={'xs'} mt="sm">
            <Button color="gray" size="xs" variant="light" onClick={() => resetErrorBoundary()}>Reset</Button>
            <Button color="gray" size="xs" variant="subtle" onClick={extensionApi.closeMe}>Close</Button>
            <Text fz={'xs'} c="dimmed">
              If error persists, try <a href="command:likec4.restart">restart the extension</a>.
            </Text>
          </Group>
        </Stack>
      </Notification>
    </Box>
  )
}

export function QueryErrorBoundary({ children }: PropsWithChildren) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary onReset={reset} FallbackComponent={Fallback}>
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  )
}
