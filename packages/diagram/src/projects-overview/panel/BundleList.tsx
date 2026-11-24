import { Badge, Checkbox, Group, Stack, Text, Tooltip, UnstyledButton } from '@mantine/core'
import { BundleProjects } from '../BundleBadges'
import { useProjectsOverviewActor } from '../context'
import type { OverviewBundle, OverviewHighlight } from '../derive'

/**
 * Edge bundles between frames. A checked bundle is shown. Click a bundle name to highlight its edges.
 */
export function BundleList({ bundles, highlight }: {
  bundles: ReadonlyArray<OverviewBundle>
  highlight: OverviewHighlight
}) {
  const actor = useProjectsOverviewActor()
  if (bundles.length === 0) {
    return <Text size="xs" c="dimmed">No edges between frames</Text>
  }
  return (
    <Stack gap={4}>
      {bundles.map(bundle => {
        const active = highlight?.kind === 'bundle' && highlight.key === bundle.key
        return (
          <Group key={bundle.key} gap={6} wrap="nowrap">
            <Checkbox
              size="xs"
              aria-label={`Show edges between ${bundle.frameTitles[0]} and ${bundle.frameTitles[1]}`}
              checked={!bundle.hidden}
              onChange={() => actor.send({ type: 'bundle.toggle', key: bundle.key })}
            />
            <Tooltip
              multiline
              w={320}
              withArrow
              position="left"
              openDelay={150}
              label={<BundleProjects bundle={bundle} />}>
              <UnstyledButton
                style={{ flex: 1, minWidth: 0 }}
                data-active={active || undefined}
                disabled={bundle.hidden}
                onClick={() =>
                  actor.send(
                    active
                      ? { type: 'highlight.clear' }
                      : { type: 'highlight.set', highlight: { kind: 'bundle', key: bundle.key } },
                  )}
              >
                <Group gap={6} wrap="nowrap" justify="space-between">
                  <Text size="xs" truncate fw={active ? 700 : 400} c={bundle.hidden ? 'dimmed' : 'inherit'}>
                    {bundle.frameTitles[0]} ↔ {bundle.frameTitles[1]}
                  </Text>
                  <Badge size="xs" variant={active ? 'filled' : 'light'} {...(bundle.hidden ? { color: 'gray' } : {})}>
                    {bundle.edgeIds.length}
                  </Badge>
                </Group>
              </UnstyledButton>
            </Tooltip>
          </Group>
        )
      })}
    </Stack>
  )
}
