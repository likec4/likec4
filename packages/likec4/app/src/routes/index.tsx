import { createFileRoute, Navigate, redirect } from '@tanstack/react-router'
import { isSingleProject } from 'virtual:likec4/projects'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    if (!isSingleProject) {
      throw redirect({
        to: '/projects/',
        replace: true,
      })
    }
  },
  component: () => (
    <Navigate
      to="/single-index/"
      mask={{
        to: '/',
        unmaskOnReload: true,
      }}
    />
  ),
})
