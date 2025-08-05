import { MantineProvider } from '@mantine/core'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Routes } from './router'
import { theme } from './theme'

createRoot(document.getElementById('likec4-root')!).render(
  <StrictMode>
    <MantineProvider theme={theme}>
      <Routes />
    </MantineProvider>
  </StrictMode>,
)
