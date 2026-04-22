import { IconRendererProvider } from '@likec4/diagram'
import { getProjectIcons } from 'likec4:icons'
import { type PropsWithChildren, useMemo } from 'react'

export function LikeC4IconRendererContext({ children, projectId }: PropsWithChildren & { projectId: string }) {
  const IconRenderer = useMemo(() => getProjectIcons(projectId), [projectId])
  return (
    <IconRendererProvider value={IconRenderer}>
      {children}
    </IconRendererProvider>
  )
}
