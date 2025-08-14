import { IconRendererProvider } from '@likec4/diagram'
import { type PropsWithChildren, Suspense } from 'react'

import type { ElementIconRenderer, ElementIconRendererProps } from '@likec4/diagram'
import { Loader } from '@mantine/core'
import { lazy } from 'react'

const ProjectIcons = lazy(async () => {
  const { ProjectIcons } = await import('likec4:icons')
  return {
    default: ProjectIcons,
  }
})

const ProjectIconRenderer = (props: ElementIconRendererProps & { projectId: string }) => {
  return (
    <Suspense fallback={<Loader className="pending" type="oval" size="xs" />}>
      <ProjectIcons {...props} />
    </Suspense>
  )
}

let _renderers = {} as Record<string, ElementIconRenderer>

export function LikeC4IconRendererContext({ children, projectId }: PropsWithChildren & { projectId: string }) {
  const IconRenderer = _renderers[projectId] ??= (props: ElementIconRendererProps) => (
    <ProjectIconRenderer {...props} projectId={projectId} />
  )
  return (
    <IconRendererProvider value={IconRenderer}>
      {children}
    </IconRendererProvider>
  )
}
