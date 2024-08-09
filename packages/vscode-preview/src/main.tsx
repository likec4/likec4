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

import { MantineProvider } from '@mantine/core'
import ReactDOM from 'react-dom/client'
import App from './App'
import { theme } from './theme'

const root = document.getElementById('root') as HTMLDivElement
const scheme = document.body.classList.contains('dark') ? 'dark' : 'light'
// const reactRoot = ReactDOM.createRoot(root)
ReactDOM.createRoot(root).render(
  <MantineProvider theme={theme} forceColorScheme={scheme}>
    <App />
  </MantineProvider>
)
