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

    const landingPage = projects[0]?.landingPage
    if (landingPage && 'redirectTo' in landingPage) {
      throw redirect({
        to: '/view/$viewId/',
        params: { viewId: landingPage.redirectTo },
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
