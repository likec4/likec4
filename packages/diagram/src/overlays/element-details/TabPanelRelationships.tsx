import { nameFromFqn } from '@likec4/core'
import type { LikeC4Model } from '@likec4/core/model'
import {
  ActionIcon,
  Box,
  Group,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Tooltip as MantineTooltip,
  UnstyledButton,
} from '@mantine/core'
import { IconArrowRight, IconExternalLink, IconInfoCircle } from '@tabler/icons-react'
import { useSelector } from '@xstate/react'
import { useCallback } from 'react'
import { unique } from 'remeda'
import { useDiagram } from '../../hooks'
import { RelationshipsBrowser } from '../relationships-browser/RelationshipsBrowser'
import { useElementDetailsActorRef } from './actorContext'
import * as css from './TabPanelRelationships.css'

type RelationshipsScope = 'global' | 'view'

type RelationshipsCount = {
  total: number
  included: number
}

export type RelationshipsStats = {
  incoming: RelationshipsCount
  outgoing: RelationshipsCount
  hidden: number
}

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
  const diagram = useDiagram()
  const delailsActor = useElementDetailsActorRef()
  const relationshipsBrowserActor = useSelector(
    delailsActor,
    useCallback(s => s.children[`${delailsActor.id}-relationships`], [delailsActor.id]),
  )

  const scope = useSelector(relationshipsBrowserActor, s => s?.context.scope ?? 'view')
  const { incoming, outgoing, hidden } = relationshipsStats(element, node, scope)

  const showAllRelationships = () => {
    relationshipsBrowserActor?.send({ type: 'change.scope', scope: 'global' })
  }

  return (
    <Stack gap={'xs'} pos={'relative'} w={'100%'} h={'100%'}>
      {(incoming.total + outgoing.total) > 0 && (
        <Group gap={'xs'} wrap="nowrap" align="center">
          <Box>
            <Group gap={8} mb={4} wrap="nowrap">
              <RelationshipsStat
                title="incoming"
                total={incoming.total}
                included={incoming.included}
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
                total={outgoing.total}
                included={outgoing.included}
              />
            </Group>
          </Box>
          {hidden > 0 && (
            <Tooltip label="Current view does not include some relationships, click to show all">
              <UnstyledButton mt={'xs'} onClick={showAllRelationships}>
                <Group gap={6} c="orange" wrap="nowrap">
                  <IconInfoCircle style={{ width: 14 }} />
                  <Text fz="sm">
                    {hidden} relationship{hidden > 1 ? 's are' : ' is'} hidden
                  </Text>
                </Group>
              </UnstyledButton>
            </Tooltip>
          )}
        </Group>
      )}

      <Box className={css.xyflow}>
        {relationshipsBrowserActor && (
          <>
            <RelationshipsBrowser actorRef={relationshipsBrowserActor} />
            <Box pos={'absolute'} top={12} right={12}>
              <ActionIcon
                size="md"
                variant="default"
                radius="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  const {
                    subject,
                    scope,
                    viewId,
                  } = relationshipsBrowserActor.getSnapshot().context
                  diagram.overlays().send({
                    type: 'open.relationshipsBrowser',
                    subject,
                    scope,
                    viewId,
                  })
                }}
              >
                <IconExternalLink stroke={1.6} style={{ width: '70%' }} />
              </ActionIcon>
            </Box>
          </>
        )}
      </Box>
    </Stack>
  )
}

/**
 * Counts the relationships of the element, and how many of them the current view shows when the scope is `view`.
 */
export function relationshipsStats(
  element: LikeC4Model.Element,
  node: LikeC4Model.Node | null,
  scope: RelationshipsScope,
): RelationshipsStats {
  const incoming = [...element.incoming()].map(r => r.id)
  const outgoing = [...element.outgoing()].map(r => r.id)

  if (scope === 'global') {
    return {
      incoming: { total: incoming.length, included: incoming.length },
      outgoing: { total: outgoing.length, included: outgoing.length },
      hidden: 0,
    }
  }

  const incomingInView = node ? unique([...node.incoming()].flatMap(e => e.$edge.relations)) : []
  const outgoingInView = node ? unique([...node.outgoing()].flatMap(e => e.$edge.relations)) : []

  return {
    incoming: { total: incoming.length, included: incomingInView.length },
    outgoing: { total: outgoing.length, included: outgoingInView.length },
    hidden: [...incoming, ...outgoing].filter(r => !incomingInView.includes(r) && !outgoingInView.includes(r)).length,
  }
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
