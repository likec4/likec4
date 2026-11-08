import { usePlayground, usePlaygroundContext } from '$/hooks/usePlayground'
import type { ReferenceKind, RemovalImpactReference, SafeDeleteOptions } from '@likec4/language-server/protocol'
import {
  ActionIcon,
  Alert,
  Anchor,
  Badge,
  Button,
  Checkbox,
  Code,
  Group,
  Loader,
  ScrollArea,
  Stack,
  Text,
} from '@mantine/core'
import { IconX } from '@tabler/icons-react'
import { useState } from 'react'
import { groupBy } from 'remeda'
import { DiffLegend } from './DiffLegend'

const resolutionTitles = {
  removed: 'Removed together with the element',
  optional: 'Removed only if selected below',
  manual: 'Fix manually',
} as const

const kindLabels: Record<ReferenceKind, string> = {
  'relation': 'relation',
  'extend-element': 'extend',
  'extend-relation': 'extend',
  'extend-deployment': 'extend',
  'deployed-instance': 'deployment',
  'deployment-relation': 'deployment',
  'view-predicate': 'view',
  'deployment-view-predicate': 'view',
  'global': 'global',
  'import': 'import',
  'view-scope': 'view',
  'dynamic-step': 'step',
  'diff': 'diff',
  'other': 'other',
}

function ReferenceList(
  { title, references, onReveal }: {
    title: string
    references: RemovalImpactReference[]
    onReveal: (reference: RemovalImpactReference) => void
  },
) {
  return (
    <Stack gap={2}>
      <Text size="xs" fw={500}>{title} ({references.length})</Text>
      {references.map((reference, index) => (
        <Group key={`${reference.location.uri}-${index}`} gap={6} wrap="nowrap" align="flex-start">
          <Badge size="xs" variant="light" color="gray" style={{ flexShrink: 0 }}>{kindLabels[reference.kind]}</Badge>
          <Anchor
            size="xs"
            component="button"
            ta="left"
            onClick={() =>
              onReveal(reference)}>
            <Code fz="xs">{reference.text}</Code>
          </Anchor>
        </Group>
      ))}
    </Stack>
  )
}

export function RemovalImpactPanel() {
  const playground = usePlayground()
  const impact = usePlaygroundContext(c => c.removalImpact)
  const [options, setOptions] = useState<Required<SafeDeleteOptions>>({
    includeOrphans: false,
    includeScopedViews: false,
    includeDynamicSteps: false,
  })
  if (!impact) {
    return null
  }
  const { report, state } = impact
  const byResolution = groupBy(report?.references ?? [], r => r.resolution)
  const reveal = (reference: RemovalImpactReference) =>
    playground.send({ type: 'workspace.revealLocation', location: reference.location })
  const toggle = (key: keyof SafeDeleteOptions) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setOptions(current => ({ ...current, [key]: event.currentTarget.checked }))
  // Options are shown only if the removal has something they apply to
  const optionLabels: Array<[keyof SafeDeleteOptions, string | false]> = report
    ? [
      [
        'includeOrphans',
        report.impact.orphans.length > 0 && `Also remove orphans: ${report.impact.orphans.join(', ')}`,
      ],
      [
        'includeScopedViews',
        report.impact.scopedViews.length > 0 && `Also remove scoped views: ${report.impact.scopedViews.join(', ')}`,
      ],
      [
        'includeDynamicSteps',
        !!byResolution['optional']?.some(r => r.kind === 'dynamic-step') && 'Also remove dynamic view steps',
      ],
    ]
    : []

  return (
    <Stack gap="xs">
      <Group justify="space-between" wrap="nowrap">
        <Text size="sm" fw={600}>
          Safe delete <Code>{impact.fqn}</Code>
        </Text>
        <ActionIcon size="sm" variant="subtle" onClick={() => playground.send({ type: 'impact.close' })}>
          <IconX size={14} />
        </ActionIcon>
      </Group>

      {state === 'pending' && <Loader size="sm" />}
      {impact.error && <Alert color="red" p="xs">{impact.error}</Alert>}

      {report && (
        <>
          <DiffLegend withOrphan />
          <Text size="xs" c="dimmed">
            {report.impact.elements.length} element(s), {report.impact.relations.length} relationship(s),{' '}
            {report.impact.deployedInstances.length} deployed instance(s), {report.impact.affectedViews.length}{' '}
            view(s) affected
          </Text>
          <ScrollArea.Autosize mah={220} type="auto">
            <Stack gap="xs">
              {(['removed', 'optional', 'manual'] as const).map(resolution =>
                byResolution[resolution]?.length
                  ? (
                    <ReferenceList
                      key={resolution}
                      title={resolutionTitles[resolution]}
                      references={byResolution[resolution]}
                      onReveal={reveal}
                    />
                  )
                  : null
              )}
            </Stack>
          </ScrollArea.Autosize>
          {optionLabels.map(([key, label]) =>
            label && <Checkbox key={key} size="xs" checked={options[key]} onChange={toggle(key)} label={label} />
          )}
          <Group gap="xs" grow>
            <Button
              size="xs"
              color="red"
              onClick={() =>
                playground.send({
                  type: 'edit.review',
                  request: { type: 'safe-delete', targets: [impact.fqn], options },
                })}>
              Review and delete
            </Button>
            <Button size="xs" variant="default" onClick={() => playground.send({ type: 'impact.close' })}>
              Cancel
            </Button>
          </Group>
        </>
      )}
    </Stack>
  )
}
