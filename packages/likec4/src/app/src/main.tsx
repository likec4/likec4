import React from 'react'
import ReactDOM from 'react-dom/client'
import { NextUIProvider } from '@nextui-org/react'
import App from './App'

ReactDOM.createRoot(document.getElementById('like4-root')!).render(
  <React.StrictMode>
    <NextUIProvider className='likec4-wrapper'>
      <App />
    </NextUIProvider>
  </React.StrictMode>
)
