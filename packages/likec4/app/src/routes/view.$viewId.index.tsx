// import { LikeC4Diagram, type OnNavigateTo } from '@likec4/diagram'
import { LikeC4Diagram } from '@likec4/diagram'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useLikeC4View } from 'virtual:likec4'
import { DiagramNotFound } from '../components'

export const Route = createFileRoute('/view/$viewId/')({
  component: ViewReact
})

function ViewReact() {
  const router = useRouter()
  const { viewId } = Route.useParams()
  const view = useLikeC4View(viewId)

  if (!view) {
    return <DiagramNotFound viewId={viewId} />
  }

  return (
    <LikeC4Diagram
      view={view}
      readonly
      controls={false}
      fitViewPadding={0.04}
      onNavigateTo={({ element }) => {
        router.navigate({
          to: '/view/$viewId',
          params: { viewId: element.navigateTo },
          startTransition: true,
          search: true
        })
      }}
    />
  )
}
