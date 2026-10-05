import { usePlayground, usePlaygroundContext } from '$/hooks/usePlayground'
import type { ViewId } from '@likec4/core'
import { ActionIcon, Divider, Group, Paper, Select, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react'
import { useMemo } from 'react'
import { DiffControls, DiffDetails } from './DiffControls'
import { LastEditBanner } from './LastEditBanner'
import { ModelEditReview } from './ModelEditReview'
import { RemovalImpactPanel } from './RemovalImpactPanel'

function SafeDeletePicker() {
  const playground = usePlayground()
  const likec4model = usePlaygroundContext(c => c.likec4model)
  const elements = useMemo(
    () => [...likec4model?.elements() ?? []].map(el => ({ value: el.id, label: `${el.title} (${el.id})` })),
    [likec4model],
  )
  return (
    <Select
      size="xs"
      label="Safe delete"
      placeholder="Pick an element to see what it takes with it"
      searchable
      data={elements}
      value={null}
      onChange={fqn => {
        if (fqn) {
          playground.send({ type: 'impact.open', fqn })
        }
      }}
    />
  )
}

/**
 * Model state (diffs) and safe delete controls, shown over the diagram.
 */
export function ModelDiffPanel({ viewId, onNavigate }: { viewId: ViewId; onNavigate: (viewId: ViewId) => void }) {
  const hasImpact = usePlaygroundContext(c => c.removalImpact !== null)
  const [expanded, { toggle }] = useDisclosure(false)
  return (
    <Paper
      shadow="md"
      p="xs"
      withBorder
      pos="absolute"
      top={56}
      right={12}
      w={300}
      style={{ zIndex: 20 }}>
      <ModelEditReview />
      <LastEditBanner />
      {hasImpact ? <RemovalImpactPanel /> : (
        <>
          <Group justify="space-between" wrap="nowrap" mb={4}>
            <Text size="xs" fw={600}>Model diff</Text>
            <ActionIcon
              size="sm"
              variant="subtle"
              aria-label={expanded ? 'Show less' : 'Show more'}
              onClick={toggle}>
              {expanded ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
            </ActionIcon>
          </Group>
          <DiffControls />
          {expanded && (
            <>
              <DiffDetails viewId={viewId} onNavigate={onNavigate} />
              <Divider my="xs" />
              <SafeDeletePicker />
            </>
          )}
        </>
      )}
    </Paper>
  )
}
