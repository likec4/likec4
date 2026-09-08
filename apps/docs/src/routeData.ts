import { defineRouteMiddleware } from '@astrojs/starlight/route-data'

export const onRequest = defineRouteMiddleware((context) => {
  const { starlightRoute } = context.locals

  const overviewItem = starlightRoute.toc?.items[0]
  if (overviewItem) {
    overviewItem.text = starlightRoute.lang === 'pt-BR' ? 'Voltar ao topo' : 'Back to top'
  }
})
