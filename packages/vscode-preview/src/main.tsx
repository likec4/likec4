import { LoadingOverlay, MantineProvider } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { QueryClientProvider, useIsFetching } from '@tanstack/react-query'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import { queryClient } from './queries'
import { QueryErrorBoundary } from './QueryErrorBoundary'
import { theme } from './theme'

const root = document.getElementById('root') as HTMLDivElement
const scheme = document.body.classList.contains('dark') ? 'dark' : 'light'
const nonce = root.getAttribute('nonce') || undefined
const getStyleNonce = nonce ? () => nonce : undefined

const Loader = () => {
  const isFetching = useIsFetching() > 0
  // Debounce loading state to prevent flickering
  const [isLoading] = useDebouncedValue(isFetching, isFetching ? 350 : 200)
  return (
    <LoadingOverlay
      visible={isLoading}
      zIndex={1000}
      overlayProps={{ blur: 1, backgroundOpacity: 0.1 }} />
  )
}

ReactDOM.createRoot(root).render(
  <MantineProvider theme={theme} forceColorScheme={scheme} {...(getStyleNonce && { getStyleNonce })}>
    <QueryClientProvider client={queryClient}>
      <QueryErrorBoundary>
        <App />
        <Loader />
      </QueryErrorBoundary>
    </QueryClientProvider>
  </MantineProvider>,
)
