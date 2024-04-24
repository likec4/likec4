import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/500.css'
import '@fontsource/ibm-plex-sans/600.css'
import '@mantine/core/styles.css'
import '@xyflow/react/dist/style.css'

import { MantineProvider } from '@mantine/core'
import ReactDOM from 'react-dom/client'
import App from './App'
import { theme } from './theme'

window.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('root') as HTMLDivElement
  const scheme = document.body.classList.contains('dark') ? 'dark' : 'light'
  // const reactRoot = ReactDOM.createRoot(root)
  ReactDOM.createRoot(root).render(
    <MantineProvider theme={theme} defaultColorScheme={scheme}>
      <App />
    </MantineProvider>
  )
})
