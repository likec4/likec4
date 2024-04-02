import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/500.css'
import '@fontsource/ibm-plex-sans/600.css'
import '@radix-ui/themes/styles.css'
import '@mantine/core/styles.css'
import '@xyflow/react/dist/style.css'
import './app.css'

import { RouterProvider } from '@tanstack/react-router'
import { useMemo } from 'react'
import ReactDOM from 'react-dom/client'
import { createRouter } from './router'

function LikeC4App({ basepath }: { basepath: string }) {
  const router = useMemo(() => createRouter(basepath), [basepath])
  return <RouterProvider router={router} />
}

export default function renderApp(basepath: string) {
  ReactDOM.createRoot(document.getElementById('like4-root')!).render(
    <LikeC4App basepath={basepath} />
  )
}
