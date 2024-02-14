import '@mantine/core/styles.css'
import './index.css'

import { MantineProvider } from '@mantine/core'
import ReactDOM from 'react-dom/client'
import App from './App'
import { theme } from './theme'

const root = document.getElementById('root') as HTMLDivElement

// const reactRoot = ReactDOM.createRoot(root)
ReactDOM.createRoot(root).render(
  <MantineProvider theme={theme} defaultColorScheme="auto">
    <App />
  </MantineProvider>
)
