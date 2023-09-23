// stores/router.ts
import { logger } from '@nanostores/logger'
import { useStore } from '@nanostores/react'
import { createRouter, openPage } from '@nanostores/router'

export const $router = createRouter({
  index: '/',
  view: '/view/:viewId'
})

export const useRoute = () => useStore($router)

export const $pages = {
  index: {
    open: () => openPage($router, 'index')
  },
  view: {
    open: (viewId: string) => openPage($router, 'view', { viewId })
  }
} as const

const destroyLogger = logger({
  $router: $router
})
if (import.meta.hot) {
  import.meta.hot.prune(() => {
    console.log('prune')
    destroyLogger()
  })
}
