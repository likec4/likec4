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

// dprint-ignore
import '@mantine/core/styles.css'
import './main.css'
import '@xyflow/react/dist/style.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Routes } from './router'

createRoot(document.getElementById('like4-root')!).render(
  <StrictMode>
    <Routes />
  </StrictMode>
)
