import { createFileRoute, Navigate } from '@tanstack/react-router'
import { useLikeC4Projects } from 'likec4:projects'

export const Route = createFileRoute('/')({
  component: () => {
    const projects = useLikeC4Projects()
    if (projects.length > 1) {
      return (
        <Navigate
          to="/projects/"
          mask={{
            to: '/',
            unmaskOnReload: true,
          }} />
      )
    }
    return (
      <Navigate
        to="/single-index/"
        mask={{
          to: '/',
          unmaskOnReload: true,
        }}
      />
    )
  },
})
