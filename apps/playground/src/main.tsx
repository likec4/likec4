// dprint-ignore
import '@mantine/core/styles.css'
import '@mantine/spotlight/styles.css'
import '@xyflow/react/dist/style.css'
import './font-fira-code.css'
import './font-ibm-plex-sans.css'
import './main.css'

import { configureMonacoWorkers } from '#monaco/bootstrap'
import { MantineProvider } from '@mantine/core'
import ReactDOM from 'react-dom/client'
import { Routes } from './router'
import { theme } from './theme'

configureMonacoWorkers()

ReactDOM.createRoot(document.getElementById('like4-root')!).render(
  <MantineProvider
    defaultColorScheme="dark"
    theme={theme}>
    <Routes />
  </MantineProvider>,
)
