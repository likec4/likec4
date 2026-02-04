import { IconRendererProvider } from '@likec4/diagram'
import { type PropsWithChildren, Suspense } from 'react'

import type { ElementIconRenderer, ElementIconRendererProps } from '@likec4/diagram'
// import { Loader } from '@mantine/core'
import { getProjectIcons } from 'likec4:icons'
// import { memo } from 'react'

// const ProjectIcons = memo(async () => {
//   const { ProjectIcons } = await import('likec4:icons')
//   return {
//     default: ProjectIcons,
//   }
// })

// const ProjectIconRenderer = ({ projectId, ...props }: ElementIconRendererProps & { projectId: string }) => {
//   const ProjectIcons = getProjectIcons(projectId)
//   return (
//     <Suspense>
//       <ProjectIcons {...props} />
//     </Suspense>
//   )
// }

let _renderers = {} as Record<string, ElementIconRenderer>

export function LikeC4IconRendererContext({ children, projectId }: PropsWithChildren & { projectId: string }) {
  const IconRenderer = _renderers[projectId] ??= (props: ElementIconRendererProps) => {
    const ProjectIcons = getProjectIcons(projectId)
    return (
      <Suspense>
        <ProjectIcons {...props} />
      </Suspense>
    )
  }
  return (
    <IconRendererProvider value={IconRenderer}>
      {children}
    </IconRendererProvider>
  )
}
