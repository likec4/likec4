import { type DiagramView, type EdgeId, type LikeC4Model, nameFromFqn, nonNullable } from '@likec4/core'
import { Box, Group, Paper, Stack, Text, ThemeIcon } from '@mantine/core'
import { IconArrowRight, IconInfoCircle } from '@tabler/icons-react'
import { ReactFlowProvider as XYFlowProvider } from '@xyflow/react'
import { LayoutGroup } from 'framer-motion'
import { unique } from 'remeda'
import { RelationshipsXYFlow } from '../relationships-of/RelationshipsXYFlow'
import * as css from './TabPanelRelationships.css'

type RelationshipsTabPanelProps = {
  currentView: DiagramView
  element: LikeC4Model.ElementModel
}

export function TabPanelRelationships({
  currentView,
  element
}: RelationshipsTabPanelProps) {
  const node = nonNullable(currentView.nodes.find((n) => n.id === element.id))

  const incoming = element.incoming().map(r => r.id)
  const outgoing = element.outgoing().map(r => r.id)

  const findRelationIds = (edgeId: EdgeId) => currentView.edges.find((edge) => edge.id === edgeId)?.relations ?? []

  const incomingInView = unique(node.inEdges.flatMap(findRelationIds))
  const outgoingInView = unique(node.outEdges.flatMap(findRelationIds))

  const notIncludedRelations = [
    ...incoming,
    ...outgoing
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

      <XYFlowProvider
        defaultNodes={[]}
        defaultEdges={[]}>
        <Box flex={'1 1 100%'} pos={'relative'} w={'100%'} h={'100%'}>
          <LayoutGroup id={'relationships-' + element.id}>
            <RelationshipsXYFlow subjectId={element.id} />
          </LayoutGroup>
        </Box>
      </XYFlowProvider>
    </Stack>
  )
}

function RelationshipsStat({
  title,
  total,
  included
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
        missing: total !== included
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
