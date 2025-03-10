import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/500.css'
import '@fontsource/ibm-plex-sans/600.css'

// dprint-ignore
import '@mantine/core/styles.css'
import '@xyflow/react/dist/style.css'
import './main.css'

import { MantineProvider } from '@mantine/core'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Routes } from './router'
import { theme } from './theme'

createRoot(document.getElementById('likec4-root')!).render(
  <StrictMode>
    <MantineProvider defaultColorScheme={'auto'} theme={theme}>
      <Routes />
    </MantineProvider>,
  </StrictMode>,
)
