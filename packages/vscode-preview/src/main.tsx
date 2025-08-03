import { Box, Button, Group, MantineProvider, Notification, ScrollAreaAutosize, Text } from '@mantine/core'
import { IconX } from '@tabler/icons-react'
import ReactDOM from 'react-dom/client'
import { type FallbackProps, ErrorBoundary } from 'react-error-boundary'
import { isError } from 'remeda'
import App from './App'
import { stateAlert } from './App.css'
import { refetchCurrentDiagram } from './state'
import { theme } from './theme'
import { ExtensionApi as extensionApi } from './vscode'

const root = document.getElementById('root') as HTMLDivElement
const scheme = document.body.classList.contains('dark') ? 'dark' : 'light'
const nonce = root.getAttribute('nonce') || undefined

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

ReactDOM.createRoot(root).render(
  <MantineProvider theme={theme} forceColorScheme={scheme} {...(nonce && { getStyleNonce: () => nonce })}>
    <ErrorBoundary FallbackComponent={Fallback}>
      <App />
    </ErrorBoundary>
  </MantineProvider>,
)
