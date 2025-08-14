import { MantineProvider } from '@mantine/core'
import { QueryClientProvider } from '@tanstack/react-query'
import ReactDOM from 'react-dom/client'
import App from './App'
import { queryClient } from './queries'
import { QueryErrorBoundary } from './QueryErrorBoundary'
import { theme } from './theme'

const root = document.getElementById('root') as HTMLDivElement
const scheme = document.body.classList.contains('dark') ? 'dark' : 'light'
const nonce = root.getAttribute('nonce') || undefined

ReactDOM.createRoot(root).render(
  <MantineProvider theme={theme} forceColorScheme={scheme} {...(nonce && { getStyleNonce: () => nonce })}>
    <QueryClientProvider client={queryClient}>
      <QueryErrorBoundary>
        <App />
      </QueryErrorBoundary>
    </QueryClientProvider>
  </MantineProvider>,
)
