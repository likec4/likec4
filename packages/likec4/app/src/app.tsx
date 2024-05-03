import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/500.css'
import '@fontsource/ibm-plex-sans/600.css'
// dprint-ignore
import '@radix-ui/themes/styles.css'
import '@mantine/core/styles.css'
import '@xyflow/react/dist/style.css'
import './app.css'

import ReactDOM from 'react-dom/client'
import { Routes } from './router'

export function renderApp(basepath: string) {
  ReactDOM.createRoot(document.getElementById('like4-root')!).render(
    <Routes basepath={basepath} />
  )
}
