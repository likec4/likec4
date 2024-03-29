import './style.css'
import ReactDOM from 'react-dom/client'
import { LikeC4App } from './app'

let BASE = import.meta.env.BASE_URL
if (!BASE.endsWith('/')) {
  BASE = BASE + '/'
}

ReactDOM.createRoot(document.getElementById('like4-root')).render(
  <LikeC4App basepath={BASE} />
)
