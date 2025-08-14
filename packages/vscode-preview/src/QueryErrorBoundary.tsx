import { Box, Button, Group, Notification, ScrollAreaAutosize, Text } from '@mantine/core'
import { IconX } from '@tabler/icons-react'
import { QueryErrorResetBoundary } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'
import { type FallbackProps, ErrorBoundary } from 'react-error-boundary'
import { stateAlert } from './App.css'
import { ExtensionApi as extensionApi } from './vscode'

const Fallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  return (
    <Box className={stateAlert}>
      <Notification
        icon={<IconX style={{ width: 20, height: 20 }} />}
        styles={{
          icon: {
            alignSelf: 'flex-start',
          },
        }}
        color={'red'}
        title={'Oops, something went wrong'}
        withCloseButton={false}>
        <ScrollAreaAutosize maw={'calc(100vw - 4rem)'} mah={'calc(100vh - 6rem)'}>
          <Text
            style={{
              whiteSpace: 'preserve-breaks',
            }}>
            {error}
          </Text>
        </ScrollAreaAutosize>
        <Group gap={'xs'} mt="sm">
          <Button color="gray" variant="light" onClick={() => resetErrorBoundary()}>Reset</Button>
          <Button color="gray" variant="subtle" onClick={extensionApi.closeMe}>Close</Button>
        </Group>
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
