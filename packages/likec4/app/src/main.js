import './style.css'
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { LikeC4App } from './app'

let BASE = import.meta.env.BASE_URL
if (!BASE.endsWith('/')) {
  BASE = BASE + '/'
}

createRoot(document.getElementById('like4-root')).render(
  createElement(LikeC4App, { basepath: BASE })
)
