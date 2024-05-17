// dprint-ignore
import './font-ibm-plex-sans.css'
import './font-fira-code.css'
import '@mantine/core/styles.css'
import '@xyflow/react/dist/style.css'
import './main.css'

import { configureMonacoWorkers } from '#monaco/bootstrap'
import ReactDOM from 'react-dom/client'
import { Routes } from './router'

configureMonacoWorkers()

ReactDOM.createRoot(document.getElementById('like4-root')!).render(
  <Routes />
)
