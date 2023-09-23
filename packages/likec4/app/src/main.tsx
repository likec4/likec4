import React from 'react'
import ReactDOM from 'react-dom/client'
import { Theme, ThemePanel } from '@radix-ui/themes'
import App from './App'
import '@radix-ui/themes/styles.css'
import './main.css'

ReactDOM.createRoot(document.getElementById('like4-root')!).render(
  <React.StrictMode>
    <Theme panelBackground='translucent' appearance='dark'>
      <App />
      <ThemePanel />
    </Theme>
  </React.StrictMode>
)
