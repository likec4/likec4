import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/500.css'
import '@fontsource/ibm-plex-sans/600.css'
import '@radix-ui/themes/styles.css'
import '@mantine/core/styles.css'
import '@xyflow/react/dist/style.css'
import './app.css'
import { RouterProvider } from '@tanstack/react-router'
import { useMemo } from 'react'
import { createRouter } from './router'

export function LikeC4App({ basepath }: { basepath: string }) {
  const router = useMemo(() => createRouter(basepath), [basepath])
  return <RouterProvider router={router} />
}
