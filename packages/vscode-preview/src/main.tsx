import { LoadingOverlay, MantineProvider } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { QueryClientProvider, useIsFetching } from '@tanstack/react-query'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import { queryClient } from './queries'
import { theme } from './theme'

const root = document.getElementById('root') as HTMLDivElement
const scheme = document.body.classList.contains('dark') ? 'dark' : 'light'
const nonce = root.getAttribute('nonce') || undefined

const Loader = () => {
  const isFetching = useIsFetching() > 0
  // Debounce loading state to prevent flickering
  const [isLoading] = useDebouncedValue(isFetching, isFetching ? 300 : 200)
  return (
    <LoadingOverlay
      visible={isLoading}
      zIndex={1000}
      overlayProps={{ blur: 1, backgroundOpacity: 0.1 }} />
  )
}

ReactDOM.createRoot(root).render(
  <MantineProvider theme={theme} forceColorScheme={scheme} {...(nonce && { getStyleNonce: () => nonce })}>
    <QueryClientProvider client={queryClient}>
      <App />
      <Loader />
    </QueryClientProvider>
  </MantineProvider>,
)
