import { type DiagramView, type LikeC4Model, nameFromFqn } from '@likec4/core'
import { Box, Button, Group, Paper, SegmentedControl, Stack, Text, ThemeIcon } from '@mantine/core'
import { useId } from '@mantine/hooks'
import { IconArrowRight, IconExternalLink, IconInfoCircle } from '@tabler/icons-react'
import { Panel } from '@xyflow/react'
import { LayoutGroup } from 'framer-motion'
import { useState } from 'react'
import { unique } from 'remeda'
import { useDiagramState } from '../../hooks'
import { useOverlayDialog } from '../OverlayContext'
import { RelationshipsXYFlow } from '../relationships-of/RelationshipsXYFlow'
import { useLayoutedRelationships } from '../relationships-of/use-layouted-relationships'
import * as css from './TabPanelRelationships.css'

type RelationshipsTabPanelProps = {
  currentView: DiagramView
  node: LikeC4Model.Node
  element: LikeC4Model.Element
}

export function TabPanelRelationships({
  currentView,
  node,
  element,
}: RelationshipsTabPanelProps) {
  const layoutId = useId()
  const enableRelationshipBrowser = useDiagramState(s => s.enableRelationshipBrowser)
  const overlay = useOverlayDialog()
  const [scope, setScope] = useState<'global' | 'view'>('view')

  const incoming = [...element.incoming()].map(r => r.id)
  const outgoing = [...element.outgoing()].map(r => r.id)

  const incomingInView = unique(node.incoming().flatMap(e => e.$edge.relations).toArray())
  const outgoingInView = unique(node.outgoing().flatMap(e => e.$edge.relations).toArray())

  const notIncludedRelations = [
    ...incoming,
    ...outgoing,
  ].filter(r => !incomingInView.includes(r) && !outgoingInView.includes(r)).length

  const {
    edges,
    nodes,
    bounds,
  } = useLayoutedRelationships(element.id, currentView, scope)

  return (
    <Stack gap={'xs'} pos={'relative'} w={'100%'} h={'100%'}>
      {(incoming.length + outgoing.length) > 0 && (
        <Group gap={'xs'} wrap="nowrap" align="center">
          <Box>
            <Group gap={8} mb={4} wrap="nowrap">
              <RelationshipsStat
                title="incoming"
                total={incoming.length}
                included={incomingInView.length}
              />
              <ThemeIcon size={'sm'} variant="transparent" c="dimmed">
                <IconArrowRight style={{ width: 16 }} />
              </ThemeIcon>
              <Text className={css.fqn}>{nameFromFqn(element.id)}</Text>
              <ThemeIcon size={'sm'} variant="transparent" c="dimmed">
                <IconArrowRight style={{ width: 16 }} />
              </ThemeIcon>
              <RelationshipsStat
                title="outgoing"
                total={outgoing.length}
                included={outgoingInView.length}
              />
            </Group>
          </Box>
          {notIncludedRelations > 0 && (
            <Group
              mt={'xs'}
              gap={6}
              c="orange"
              style={{ cursor: 'pointer' }}>
              <IconInfoCircle style={{ width: 14 }} />
              <Text fz="sm">
                {notIncludedRelations} relationship{notIncludedRelations > 1 ? 's are' : ' is'} hidden
              </Text>
            </Group>
          )}
        </Group>
      )}

      <Box className={css.xyflow}>
        <LayoutGroup id={layoutId}>
          <RelationshipsXYFlow
            subjectId={element.id}
            bounds={bounds}
            nodes={nodes}
            edges={edges}
            view={currentView}
            elementsSelectable={false}
          >
            <Panel position="top-left" className={css.panelScope}>
              <SegmentedControl
                size="xs"
                withItemsBorders={false}
                value={scope}
                onChange={setScope as any}
                data={[
                  { label: 'Global', value: 'global' },
                  { label: 'View', value: 'view' },
                ]}
              />
            </Panel>
            {enableRelationshipBrowser && (
              <Panel position="top-right">
                <Button
                  size="compact-sm"
                  variant="default"
                  fz={'xs'}
                  fw={500}
                  rightSection={<IconExternalLink stroke={1.6} style={{ width: 16 }} />}
                  onClick={(e) => {
                    e.stopPropagation()
                    overlay.close(() => {
                      overlay.openOverlay({
                        relationshipsOf: element.id,
                      })
                    })
                  }}
                >
                  Open
                </Button>
              </Panel>
            )}
          </RelationshipsXYFlow>
        </LayoutGroup>
      </Box>
    </Stack>
  )
}

function RelationshipsStat({
  title,
  total,
  included,
}: {
  title: string
  total: number
  included: number
}) {
  return (
    <Paper
      withBorder
      shadow="none"
      className={css.relationshipStat}
      px="md"
      py="xs"
      radius="md"
      mod={{
        zero: total === 0,
        missing: total !== included,
      }}>
      <Stack gap={4} align="flex-end">
        <Text component="div" c={total !== included ? 'orange' : 'dimmed'} tt="uppercase" fw={600} fz={10} lh={1}>
          {title}
        </Text>
        <Text fw={600} fz={'xl'} component="div" lh={1}>
          {total !== included
            ? (
              <>
                {included} / {total}
              </>
            )
            : (
              <>
                {total}
              </>
            )}
        </Text>
        {
          /* <ThemeIcon
          color="gray"
          variant="light"
          style={{
            color: stat.diff > 0 ? 'var(--mantine-color-teal-6)' : 'var(--mantine-color-red-6)'
          }}
          size={38}
          radius="md"
        >
          <DiffIcon size="1.8rem" stroke={1.5} />
        </ThemeIcon> */
        }
      </Stack>
      {
        /* <Text c="dimmed" fz="sm" mt="md">
          <Text component="span" c={stat.diff > 0 ? 'teal' : 'red'} fw={700}>
            {stat.diff}%
          </Text>{' '}
          {stat.diff > 0 ? 'increase' : 'decrease'} compared to last month
        </Text> */
      }
    </Paper>
  )
}
