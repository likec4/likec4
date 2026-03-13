import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Routes } from './router'

createRoot(document.getElementById('likec4-root')!).render(
  <StrictMode>
    <Routes />
  </StrictMode>,
)
