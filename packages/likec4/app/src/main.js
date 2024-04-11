import { renderApp } from './app'

let BASE = import.meta.env.BASE_URL
if (!BASE.endsWith('/')) {
  BASE = BASE + '/'
}
renderApp(BASE)
