import '@radix-ui/themes/styles.css'
import '@mantine/core/styles.css'
import './main.css'
import { RouterProvider } from '@tanstack/react-router'
import { Provider } from 'jotai'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { router } from './router'

ReactDOM.createRoot(document.getElementById('like4-root')!).render(
  <React.StrictMode>
    <Provider>
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>
)
