import { usePlayground, usePlaygroundContext } from '$/hooks/usePlayground'
import type { DiffViewSummary, ViewId } from '@likec4/core'
import type { CompareViewMode } from '@likec4/core/compute-view'
import type { DiffAction } from '@likec4/language-server/protocol'
import { Anchor, Button, Group, SegmentedControl, Select, Stack, Text } from '@mantine/core'
import { DiffLegend } from './DiffLegend'

const NoDiff = '__as-is__'

const compareModes: Array<{ value: CompareViewMode; label: string }> = [
  { value: 'as-is', label: 'As-is' },
  { value: 'changes', label: 'Changes' },
  { value: 'to-be', label: 'To-be' },
]

function changesText({ nodes, edges }: DiffViewSummary): string {
  const parts = [
    nodes.added + edges.added > 0 && `+${nodes.added + edges.added}`,
    nodes.removed + edges.removed > 0 && `−${nodes.removed + edges.removed}`,
    nodes.modified + edges.modified > 0 && `~${nodes.modified + edges.modified}`,
  ]
  return parts.filter(Boolean).join(' ')
}

/**
 * Model state selector and compare mode
 */
export function DiffControls() {
  const playground = usePlayground()
  const { diffs, activeDiffId, compareMode, compareError } = usePlaygroundContext(c => ({
    diffs: c.diffs,
    activeDiffId: c.activeDiffId,
    compareMode: c.compareMode,
    compareError: c.compareView?.viewId === c.activeViewId && c.compareView?.diffId === c.activeDiffId
      ? c.compareView?.error ?? null
      : null,
  }))

  return (
    <Stack gap="xs">
      <Select
        size="xs"
        aria-label="Model state"
        data={[
          { value: NoDiff, label: 'As-is (no diff)' },
          ...diffs.map(d => ({ value: d.id, label: d.title ?? d.id })),
        ]}
        value={activeDiffId ?? NoDiff}
        allowDeselect={false}
        onChange={value =>
          playground.send({
            type: 'diff.select',
            diffId: value && value !== NoDiff ? value : null,
          })}
      />
      {activeDiffId && (
        <SegmentedControl
          size="xs"
          fullWidth
          value={compareMode}
          onChange={mode => playground.send({ type: 'diff.changeMode', mode })}
          data={compareModes}
        />
      )}
      {activeDiffId && compareMode === 'changes' && <DiffLegend />}
      {compareError && <Text size="xs" c="dimmed">{compareError}</Text>}
    </Stack>
  )
}

/**
 * Views changed by the active diff, apply and discard
 */
export function DiffDetails({ viewId, onNavigate }: { viewId: ViewId; onNavigate: (viewId: ViewId) => void }) {
  const playground = usePlayground()
  const activeDiff = usePlaygroundContext(c => c.diffs.find(d => d.id === c.activeDiffId) ?? null)
  if (!activeDiff) {
    return <Text size="xs" c="dimmed" mt="xs">Select a diff to compare the model before and after it.</Text>
  }
  const viewChanges = activeDiff.views.find(v => v.id === viewId) ?? null
  const review = (action: DiffAction) =>
    playground.send({ type: 'edit.review', request: { type: 'apply-diff', diffId: activeDiff.id, action } })

  return (
    <Stack gap="xs" mt="xs">
      <Text size="xs" c="dimmed">
        {viewChanges ? `This view: ${changesText(viewChanges)}` : 'This view is not changed by the diff'}
      </Text>
      {activeDiff.views.length > 0 && (
        <Stack gap={2}>
          <Text size="xs" fw={500}>Views changed by the diff</Text>
          {activeDiff.views.map(view => (
            <Group key={view.id} justify="space-between" wrap="nowrap">
              <Anchor
                size="xs"
                component="button"
                fw={view.id === viewId ? 600 : 400}
                onClick={() => onNavigate(view.id)}>
                {view.title ?? view.id}
              </Anchor>
              <Text size="xs" c="dimmed">{changesText(view)}</Text>
            </Group>
          ))}
        </Stack>
      )}
      <Group gap="xs" grow>
        <Button size="xs" color="teal" onClick={() => review('apply')}>
          Review and apply
        </Button>
        <Button size="xs" variant="default" onClick={() => review('discard')}>
          Discard
        </Button>
      </Group>
    </Stack>
  )
}
