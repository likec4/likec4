import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/500.css'
import '@fontsource/ibm-plex-sans/600.css'

// dprint-ignore
import '@mantine/core/styles.css'
import '@xyflow/react/dist/style.css'
import './main.css'

import { createRoot } from 'react-dom/client'
import { Routes } from './router'

createRoot(document.getElementById('like4-root')!).render(
  // <StrictMode>
  <Routes />,
  // </StrictMode>
)
