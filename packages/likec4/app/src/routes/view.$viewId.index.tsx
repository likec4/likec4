// import { LikeC4Diagram, type OnNavigateTo } from '@likec4/diagram'
import { LikeC4Diagram } from '@likec4/diagram'
import { createFileRoute, notFound, useRouter } from '@tanstack/react-router'
import { useLikeC4View } from '../data'

export const Route = createFileRoute('/view/$viewId/')({
  component: ViewReact
})

function ViewReact() {
  const router = useRouter()
  const { viewId } = Route.useParams()
  const view = useLikeC4View(viewId)

  if (!view) {
    throw notFound()
  }

  return (
    <LikeC4Diagram
      view={view}
      readonly
      controls={false}
      fitViewPadding={0.08}
      onNavigateTo={(viewId) => {
        router.navigate({
          to: '/view/$viewId',
          params: { viewId },
          startTransition: true,
          search: true
        })
      }}
    />
  )
}
