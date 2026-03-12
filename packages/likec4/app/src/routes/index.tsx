import { createFileRoute, redirect } from '@tanstack/react-router'
import { projects } from 'likec4:projects'

export const Route = createFileRoute('/')({
  beforeLoad: ({ context }) => {
    if (context.projects.length > 1) {
      throw redirect({
        to: '/projects/',
        mask: {
          to: '/',
          unmaskOnReload: true,
        },
      })
    }

    if (projects[0]?.landingPage && 'redirect' in projects[0].landingPage) {
      throw redirect({
        to: '/view/$viewId/',
        params: { viewId: 'index' },
        mask: {
          to: '/',
          unmaskOnReload: true,
        },
      })
    }

    throw redirect({
      to: '/single-index/',
      mask: {
        to: '/',
        unmaskOnReload: true,
      },
    })
  },
})
