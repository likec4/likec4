import { token } from '@likec4/styles/tokens'
import { Box, Group, Text } from '@mantine/core'

const items = [
  { label: 'added', color: token.var('colors.likec4.diff.added'), style: 'solid' },
  { label: 'removed', color: token.var('colors.likec4.diff.removed'), style: 'dashed' },
  { label: 'modified', color: token.var('colors.likec4.diff.modified'), style: 'dashed' },
] as const

const orphan = { label: 'orphan', color: token.var('colors.likec4.diff.orphan'), style: 'dotted' } as const

export function DiffLegend({ withOrphan = false }: { withOrphan?: boolean }) {
  const legend = withOrphan ? [...items, orphan] : items
  return (
    <Group gap="sm">
      {legend.map(item => (
        <Group key={item.label} gap={4} wrap="nowrap">
          <Box
            w={12}
            h={12}
            style={{ border: `2px ${item.style} ${item.color}`, borderRadius: 3 }}
          />
          <Text size="xs" c="dimmed">{item.label}</Text>
        </Group>
      ))}
    </Group>
  )
}
