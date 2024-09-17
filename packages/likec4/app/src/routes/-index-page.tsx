import { Link } from '@tanstack/react-router'

import { StaticLikeC4Diagram, useLikeC4DiagramView, useLikeC4Views } from '@likec4/diagram'
import { useDebouncedEffect } from '@react-hookz/web'
import { useState } from 'react'

import { Box, Card, Group, SimpleGrid, Text } from '@mantine/core'
import { ceil, clamp, keys } from 'remeda'
import type { DiagramView } from 'virtual:likec4/model'
import { RenderIcon } from '../components/RenderIcon'
import * as styles from './index.css'

export default function IndexPage() {
  const views = keys(useLikeC4Views())

  return (
    <SimpleGrid
      p={{ base: 'md', sm: 'xl' }}
      cols={{ base: 1, sm: 2, md: 3, lg: 5 }}
      spacing={{ base: 10, sm: 'xl' }}
      verticalSpacing={{ base: 'md', sm: 'xl' }}
    >
      {views.map(v => <ViewCard key={v} viewId={v} />)}
    </SimpleGrid>
  )
}

function ViewCard({ viewId }: { viewId: string }) {
  const diagram = useLikeC4DiagramView(viewId)
  if (!diagram) {
    return null
  }
  const { id, title, description } = diagram
  return (
    <Card
      component={Link}
      to={'/view/$viewId'}
      params={{ viewId: id }}
      search
      shadow="xs"
      padding="lg"
      radius="sm"
      withBorder>
      <Card.Section>
        <DiagramPreview diagram={diagram} />
      </Card.Section>

      <Group justify="space-between" mt="md" mb="xs">
        <Text fw={500}>{title}</Text>
      </Group>

      <Text size="sm" c="dimmed">
        {description}
      </Text>
    </Card>
  )
}

function DiagramPreview(props: { diagram: DiagramView }) {
  const [diagram, setDiagram] = useState<DiagramView | null>(null)

  // defer rendering to avoid flickering
  useDebouncedEffect(
    () => {
      setDiagram(props.diagram)
    },
    [props.diagram],
    clamp(ceil(Math.random() * 400, -1), {
      min: 50
    })
  )

  return (
    <Box className={styles.previewBg} style={{ height: 175 }}>
      {diagram && (
        <StaticLikeC4Diagram
          background={'transparent'}
          view={diagram}
          keepAspectRatio={false}
          renderIcon={RenderIcon}
          fitView
          fitViewPadding={0.1} />
      )}
    </Box>
  )
}
