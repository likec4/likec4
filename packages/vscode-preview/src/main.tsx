import '@fontsource/ibm-plex-sans/latin-400.css'
import '@fontsource/ibm-plex-sans/latin-500.css'
import '@fontsource/ibm-plex-sans/latin-600.css'
import '@fontsource/ibm-plex-sans/latin-ext-400.css'
import '@fontsource/ibm-plex-sans/latin-ext-500.css'
import '@fontsource/ibm-plex-sans/latin-ext-600.css'
import '@fontsource/ibm-plex-sans/cyrillic-400.css'
import '@fontsource/ibm-plex-sans/cyrillic-500.css'
import '@fontsource/ibm-plex-sans/cyrillic-600.css'
import '@fontsource/ibm-plex-sans/cyrillic-ext-400.css'
import '@fontsource/ibm-plex-sans/cyrillic-ext-500.css'
import '@fontsource/ibm-plex-sans/cyrillic-ext-600.css'

import '@mantine/core/styles.css'

import { Box, MantineProvider, Notification } from '@mantine/core'
import { IconX } from '@tabler/icons-react'
import ReactDOM from 'react-dom/client'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'
import { isError } from 'remeda'
import App from './App'
import { LikeC4Context } from './Context'
import { theme } from './theme'

const root = document.getElementById('root') as HTMLDivElement
const scheme = document.body.classList.contains('dark') ? 'dark' : 'light'
const nonce = root.getAttribute('nonce') || undefined

const Fallback = ({ error }: FallbackProps) => {
  return (
    <Box p={'sm'}>
      <Notification
        icon={<IconX style={{ width: 20, height: 20 }} />}
        color={'red'}
        style={{
          whiteSpace: 'preserve-breaks'
        }}
        withCloseButton={false}>
        {isError<Error>(error) ? (error.stack ?? error.message) : `Something went wrong:\n${error}`}
      </Notification>
    </Box>
  )
}

ReactDOM.createRoot(root).render(
  <MantineProvider theme={theme} forceColorScheme={scheme} {...(nonce && { getStyleNonce: () => nonce })}>
    <ErrorBoundary FallbackComponent={Fallback}>
      <LikeC4Context>
        <App />
      </LikeC4Context>
    </ErrorBoundary>
  </MantineProvider>
)
