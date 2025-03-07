import { useMatches } from '@tanstack/react-router'

export function useWorkspaceIdFromRoute() {
  return useMatches({
    select: routes => routes.find(r => r.routeId === '/w/$workspaceId')?.params.workspaceId ?? null,
  })
}
