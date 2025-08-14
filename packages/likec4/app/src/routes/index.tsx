import { useLikeC4Projects } from '@likec4/diagram'
import { createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: () => {
    const projects = useLikeC4Projects()
    if (projects.length > 1) {
      return <Navigate to="/projects/" replace />
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
