import { Theme } from '@radix-ui/themes'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('like4-root')!).render(
  <React.StrictMode>
    <Theme accentColor='iris' panelBackground='translucent' radius='small'>
      <App />
    </Theme>
  </React.StrictMode>
)
