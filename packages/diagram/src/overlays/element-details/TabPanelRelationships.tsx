import { type LikeC4Model, nameFromFqn } from '@likec4/core'
import { Box, Group, Paper, Stack, Text, ThemeIcon, Tooltip as MantineTooltip } from '@mantine/core'
import { IconArrowRight, IconInfoCircle } from '@tabler/icons-react'
import { useSelector } from '@xstate/react'
import { useState } from 'react'
import { unique } from 'remeda'
import { RelationshipsBrowser } from '../relationships-browser/RelationshipsBrowser'
import { useElementDetailsActorRef } from './actorContext'
import * as css from './TabPanelRelationships.css'

type RelationshipsTabPanelProps = {
  node: LikeC4Model.Node | null
  element: LikeC4Model.Element
}

const Tooltip = MantineTooltip.withProps({
  color: 'dark',
  fz: 'xs',
  openDelay: 600,
  closeDelay: 120,
  label: '',
  children: null,
  offset: 8,
  withinPortal: false,
})

export function TabPanelRelationships({
  node,
  element,
}: RelationshipsTabPanelProps) {
  const delailsActor = useElementDetailsActorRef()
  const relationshipsBrowserActor = useSelector(delailsActor, s => s.children[`${delailsActor.id}-relationships`])
  const [scope, setScope] = useState<'global' | 'view'>('view')

  const incoming = [...element.incoming()].map(r => r.id)
  const outgoing = [...element.outgoing()].map(r => r.id)

  const incomingInView = node ? unique([...node.incoming()].flatMap(e => e.$edge.relations)) : []
  const outgoingInView = node ? unique([...node.outgoing()].flatMap(e => e.$edge.relations)) : []

  const notIncludedRelations = [
    ...incoming,
    ...outgoing,
  ].filter(r => !incomingInView.includes(r) && !outgoingInView.includes(r)).length
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
            <Tooltip label="Current view does not include some relationships">
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
            </Tooltip>
          )}
        </Group>
      )}

      <Box className={css.xyflow}>
        {relationshipsBrowserActor && <RelationshipsBrowser actorRef={relationshipsBrowserActor} />}
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
