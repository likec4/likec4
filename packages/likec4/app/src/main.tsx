import '@mantine/core/styles.css'
import '@radix-ui/themes/styles.css'
import { RouterProvider } from '@tanstack/react-router'
import './main.css'
import ReactDOM from 'react-dom/client'
import { router } from './router'

ReactDOM.createRoot(document.getElementById('like4-root')!).render(
  <RouterProvider router={router} />
)
