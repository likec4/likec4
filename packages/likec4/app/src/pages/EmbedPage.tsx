import { getViewBounds, StaticLikeC4Diagram } from '@likec4/diagram'
import { useSearch } from '@tanstack/react-router'
import { useCurrentDiagram, useTransparentBackground } from '../hooks'

export function EmbedPage() {
  const {
    padding = 20,
    dynamic,
  } = useSearch({
    strict: false,
  })
  const diagram = useCurrentDiagram()

  useTransparentBackground(!!diagram)

  if (!diagram) {
    return <div>Loading...</div>
  }

  const bounds = getViewBounds(diagram, dynamic)

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        boxSizing: 'border-box',
        padding,
        transform: 'translateX(-50%)',
        aspectRatio: `${bounds.width + padding * 2} / ${bounds.height + padding * 2}`,
        width: '100vw',
        maxWidth: bounds.width + padding * 2,
        height: 'auto',
        maxHeight: '100vh',
      }}
    >
      <StaticLikeC4Diagram
        view={diagram}
        fitView={true}
        background={'transparent'}
        fitViewPadding={0}
        dynamicViewVariant={dynamic}
        initialWidth={bounds.width}
        initialHeight={bounds.height} />
    </div>
  )
}
