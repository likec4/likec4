import { LikeC4View } from '@likec4/diagram'
import { createFileRoute } from '@tanstack/react-router'
import { DiagramNotFound } from '../components'
import { useLikeC4View } from '../data'
import { useTransparentBackground } from '../useTransparentBackground'

const asPadding = (v: unknown) => {
  const parsed = typeof v === 'string' ? parseFloat(v) : undefined
  if (parsed && isFinite(parsed) && isNaN(parsed) === false) {
    return Math.round(parsed)
  }
  return undefined
}

export const Route = createFileRoute('/export/$viewId')({
  component: ExportPage,
  validateSearch: (search: Record<string, unknown>) => {
    // validate and parse the search params into a typed state
    return {
      padding: asPadding(search.padding)
    }
  }
})

function ExportPage() {
  const { padding = 20 } = Route.useSearch()
  const { viewId } = Route.useParams()
  const diagram = useLikeC4View(viewId)

  useTransparentBackground(!!diagram)

  if (!diagram) {
    return <DiagramNotFound viewId={viewId} />
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: diagram.width + padding * 2,
        height: diagram.height + padding * 2,
        padding,
        minWidth: '100vw',
        minHeight: '100vh'
      }}>
      <LikeC4View
        view={diagram}
        fitViewPadding={0}
        reactflowProps={{
          fitView: false,
          width: diagram.width,
          height: diagram.height
        }}
      />
    </div>
  )
}
