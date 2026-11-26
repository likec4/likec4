import type { ProjectsOverviewLegend } from '@likec4/core'
import { Group, Stack, Text } from '@mantine/core'
import { useLikeC4Styles } from '../../hooks/useLikeC4Styles'

/**
 * Swatches and project counts for the `colorBy` values of the overview.
 */
export function ColorLegend({ legend }: { legend: ProjectsOverviewLegend }) {
  const { theme } = useLikeC4Styles()
  return (
    <Stack gap={4}>
      {legend.colorBy.entries.map(entry => (
        <Group key={entry.value} gap={6} wrap="nowrap">
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: 3,
              flexShrink: 0,
              background: theme.colors[entry.color].elements.fill,
            }}
          />
          <Text size="xs" truncate style={{ flex: 1 }}>{entry.value}</Text>
          <Text size="xs" c="dimmed">{entry.count}</Text>
        </Group>
      ))}
    </Stack>
  )
}
