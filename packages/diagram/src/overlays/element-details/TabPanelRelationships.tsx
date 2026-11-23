import { nameFromFqn } from '@likec4/core'
import type { LikeC4Model } from '@likec4/core/model'
import type { RelationId } from '@likec4/core/types'
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
import { useCallback, useRef } from 'react'
import { useDiagramEventHandlers } from '../../context/DiagramEventHandlers'
import { useDiagram } from '../../hooks'
import { useCurrentViewModel } from '../../hooks/useCurrentViewModel'
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
  element,
}: RelationshipsTabPanelProps) {
  const diagram = useDiagram()
  const view = useCurrentViewModel()
  const { onRelationshipBrowserScopeChange } = useDiagramEventHandlers()
  const browserRef = useRef<HTMLDivElement>(null)
  const delailsActor = useElementDetailsActorRef()
  const relationshipsBrowserActor = useSelector(
    delailsActor,
    useCallback(s => s.children[`${delailsActor.id}-relationships`], [delailsActor.id]),
  )

  const scope = useSelector(relationshipsBrowserActor, s => s?.context.scope ?? 'view')
  const isBrowserActive = useSelector(relationshipsBrowserActor, s => s?.hasTag('active') ?? false)
  const { incoming, outgoing, hidden } = relationshipsStats(element, view, scope)

  // The notice counts the card's element, while the browser may have navigated to another one
  const showAllRelationships = () => {
    if (!relationshipsBrowserActor) {
      return
    }
    if (relationshipsBrowserActor.getSnapshot().context.subject !== element.id) {
      relationshipsBrowserActor.send({ type: 'navigate.to', subject: element.id })
    }
    relationshipsBrowserActor.send({ type: 'change.scope', scope: 'global' })
    onRelationshipBrowserScopeChange?.('global')
    browserRef.current?.querySelector<HTMLInputElement>('input[type="radio"][value="global"]')?.focus()
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
              <UnstyledButton mt={'xs'} disabled={!isBrowserActive} onClick={showAllRelationships}>
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

      <Box ref={browserRef} className={css.xyflow}>
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
 * Counts the relationships of the element, and how many of them the view includes when the scope is `view`.
 */
export function relationshipsStats(
  element: LikeC4Model.Element,
  view: LikeC4Model.View,
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

  const isIncluded = (id: RelationId) => view.includesRelation(id)
  return {
    incoming: { total: incoming.length, included: incoming.filter(isIncluded).length },
    outgoing: { total: outgoing.length, included: outgoing.filter(isIncluded).length },
    hidden: [...incoming, ...outgoing].filter(id => !isIncluded(id)).length,
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
