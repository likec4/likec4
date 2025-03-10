import { StaticLikeC4Diagram } from '@likec4/diagram'
import { Box } from '@mantine/core'
import { notFound, useSearch } from '@tanstack/react-router'
import { useCurrentDiagram, useTransparentBackground } from '../hooks'

export function EmbedPage() {
  const { padding = 20 } = useSearch({
    strict: false,
  })
  const diagram = useCurrentDiagram()

  useTransparentBackground(!!diagram)

  if (!diagram) {
    throw notFound()
  }

  return (
    <Box
      pos={'absolute'}
      style={{
        top: 0,
        left: '50%',
        boxSizing: 'border-box',
        padding,
        transform: 'translateX(-50%)',
        aspectRatio: `${diagram.bounds.width + padding * 2} / ${diagram.bounds.height + padding * 2}`,
        width: '100vw',
        maxWidth: diagram.bounds.width + padding * 2,
        height: 'auto',
        maxHeight: '100vh',
      }}
    >
      <StaticLikeC4Diagram
        view={diagram}
        fitView={true}
        background={'transparent'}
        initialWidth={diagram.bounds.width}
        initialHeight={diagram.bounds.height} />
    </Box>
  )
}
