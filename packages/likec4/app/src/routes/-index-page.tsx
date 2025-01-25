import { Link } from '@tanstack/react-router'

import { StaticLikeC4Diagram } from '@likec4/diagram'
import { memo, useLayoutEffect, useState } from 'react'

import type { DiagramView } from '@likec4/core'
import { Box, Card, Group, SimpleGrid, Text } from '@mantine/core'
import { useInViewport } from '@mantine/hooks'
import { keys } from 'remeda'
import { useLikeC4Model } from 'virtual:likec4/model'
import { RenderIcon } from '../components/RenderIcon'
import * as styles from './index.css'

export default function IndexPage() {
  const views = keys(useLikeC4Model().$model.views)

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

const ViewCard = memo<{ viewId: string }>(({ viewId }) => {
  const diagram = useLikeC4Model().findView(viewId)?.$view
  if (!diagram) {
    return null
  }
  const { id, title, description } = diagram
  return (
    <Card
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
      <Link to={'/view/$viewId'} params={{ viewId: id }} search className={styles.cardLink}></Link>
    </Card>
  )
})

function DiagramPreview({ diagram }: { diagram: DiagramView }) {
  const { ref, inViewport } = useInViewport()
  const [visible, setVisible] = useState(inViewport)

  useLayoutEffect(() => {
    if (inViewport && !visible) {
      setVisible(true)
    }
  }, [inViewport])

  return (
    <Box ref={ref} className={styles.previewBg} style={{ height: 175 }}>
      {visible && (
        <StaticLikeC4Diagram
          background={'transparent'}
          view={diagram}
          renderIcon={RenderIcon}
          fitView
          fitViewPadding={0.1} />
      )}
    </Box>
  )
}
