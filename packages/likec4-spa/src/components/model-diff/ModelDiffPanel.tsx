import { type CompareViewMode, filterCompareView } from '@likec4/core/compute-view'
import type { LayoutedView, ViewId } from '@likec4/core/types'
import { token } from '@likec4/styles/tokens'
import { Box, Group, Paper, SegmentedControl, Select, Stack, Text } from '@mantine/core'
import { useMemo } from 'react'
import { useModelDiffs } from '../../context/ModelDiffsContext'
import { selectCompareMode, selectDiff, useModelDiffState } from './state'

const NoDiff = '__as-is__'

const compareModes: Array<{ value: CompareViewMode; label: string }> = [
  { value: 'as-is', label: 'As-is' },
  { value: 'changes', label: 'Changes' },
  { value: 'to-be', label: 'To-be' },
]

const legend = [
  { label: 'added', color: token.var('colors.likec4.diff.added'), style: 'solid' },
  { label: 'removed', color: token.var('colors.likec4.diff.removed'), style: 'dashed' },
  { label: 'modified', color: token.var('colors.likec4.diff.modified'), style: 'dashed' },
] as const

/**
 * Compare view of the selected diff, to show instead of the view.
 * `null` for the model as is, or if the diff does not change the view.
 */
export function useCompareView(viewId: ViewId | undefined): LayoutedView | null {
  const { views } = useModelDiffs()
  const { diffId, mode } = useModelDiffState()
  const view = diffId && viewId ? views[diffId]?.[viewId] : undefined
  return useMemo(() => view ? filterCompareView(view, mode) : null, [view, mode])
}

/**
 * Model state selector (as-is or a diff) and compare mode.
 * Renders nothing if the project has no diffs.
 */
export function ModelDiffPanel({ viewId }: { viewId: ViewId }) {
  const { diffs, views } = useModelDiffs()
  const { diffId, mode } = useModelDiffState()

  if (diffs.length === 0) {
    return null
  }

  return (
    <Paper shadow="md" p="xs" withBorder pos="absolute" top={56} right={12} w={280} style={{ zIndex: 20 }}>
      <Stack gap="xs">
        <Select
          size="xs"
          aria-label="Model state"
          data={[
            { value: NoDiff, label: 'As-is (no diff)' },
            ...diffs.map(d => ({ value: d.id, label: d.title ?? d.id })),
          ]}
          value={diffId ?? NoDiff}
          allowDeselect={false}
          onChange={value => selectDiff(value && value !== NoDiff ? value : null)}
        />
        {diffId && (
          <>
            <SegmentedControl
              size="xs"
              fullWidth
              value={mode}
              onChange={selectCompareMode}
              data={compareModes}
            />
            {mode === 'changes' && (
              <Group gap="sm">
                {legend.map(item => (
                  <Group key={item.label} gap={4} wrap="nowrap">
                    <Box w={12} h={12} style={{ border: `2px ${item.style} ${item.color}`, borderRadius: 3 }} />
                    <Text size="xs" c="dimmed">{item.label}</Text>
                  </Group>
                ))}
              </Group>
            )}
            <Text size="xs" c="dimmed">
              {views[diffId]?.[viewId] ? 'This view is changed by the diff' : 'This view is not changed by the diff'}
            </Text>
          </>
        )}
      </Stack>
    </Paper>
  )
}
