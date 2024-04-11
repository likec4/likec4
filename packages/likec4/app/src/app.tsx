import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/500.css'
import '@fontsource/ibm-plex-sans/600.css'
// dprint-ignore
import '@radix-ui/themes/styles.css'
import '@mantine/core/styles.css'
import '@xyflow/react/dist/style.css'
import './app.css'

import { RouterProvider } from '@tanstack/react-router'
import ReactDOM from 'react-dom/client'
import { createRouter } from './router'

export function renderApp(basepath: string) {
  const router = createRouter(basepath)
  ReactDOM.createRoot(document.getElementById('like4-root')!).render(
    <RouterProvider router={router} />
  )
}
