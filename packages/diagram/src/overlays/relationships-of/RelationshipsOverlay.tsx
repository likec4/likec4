import { type Fqn } from '@likec4/core'
import { Box, Button, Group, SegmentedControl, Space, Text } from '@mantine/core'
import { useLocalStorage, useStateHistory } from '@mantine/hooks'
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react'
import { Panel, useReactFlow, useStoreApi } from '@xyflow/react'
import { memo, useEffect } from 'react'
import { useDiagramState } from '../../hooks/useDiagramState'
import { useOverlayDialog } from '../OverlayContext'
import type { XYFlowTypes } from './_types'
import { RelationshipsXYFlow } from './RelationshipsXYFlow'
import { SelectElement } from './SelectElement'
import { useLayoutedRelationships } from './use-layouted-relationships'

export const RelationshipsOverlay = memo<{ subjectId: Fqn }>(function RelationshipsOverlay({ subjectId }) {
  const view = useDiagramState(s => s.view)
  const [_scope, setScope] = useLocalStorage<'global' | 'view'>({
    key: 'likec4:scope-relationships-of',
    getInitialValueInEffect: false,
    defaultValue: 'view'
  })
  const {
    notIncludedRelations,
    viewIncludesSubject,
    edges,
    nodes,
    subject,
    bounds
  } = useLayoutedRelationships(subjectId, view, _scope)
  const scope = viewIncludesSubject ? _scope : 'global'
  const showSubjectWarning = !viewIncludesSubject && _scope === 'view'
  const [historySubjectId, historyOps, { history, current }] = useStateHistory(subjectId)

  const xyflow = useReactFlow<XYFlowTypes.Node, XYFlowTypes.Edge>()
  const xystore = useStoreApi<XYFlowTypes.Node, XYFlowTypes.Edge>()
  const overlay = useOverlayDialog()

  useEffect(() => {
    if (historySubjectId !== subjectId) {
      historyOps.set(subjectId)
    }
  }, [subjectId])

  useEffect(() => {
    if (historySubjectId !== subjectId) {
      overlay.openOverlay({
        relationshipsOf: historySubjectId
      })
    }
  }, [historySubjectId])

  return (
    <RelationshipsXYFlow
      nodes={nodes}
      edges={edges}
      bounds={bounds}
      view={view}
      subjectId={subjectId}
      viewportPadding={0.2}
      onNodeClick={(e, node) => {
        e.stopPropagation()
        if (node.type === 'empty') return
        // lastClickedNodeRef.current = node
        overlay.openOverlay({
          relationshipsOf: node.data.fqn
        })
      }}
    >
      <Panel position="top-center">
        <Group gap={'xs'} wrap={'nowrap'}>
          <Button
            leftSection={<IconArrowLeft stroke={3} size={14} />}
            color="dimmed"
            variant="subtle"
            style={{
              visibility: current > 0 ? 'visible' : 'hidden',
              padding: '0.25rem 0.75rem'
            }}
            styles={{
              label: {
                fontWeight: 400
              },
              section: {
                marginInlineEnd: 6
              }
            }}
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              historyOps.back()
            }}>
            Back
          </Button>
          <Space w={2} />
          <Group gap={'xs'} pos={'relative'} wrap="nowrap" flex={'1 0 auto'}>
            <Box fz={'sm'} fw={'400'} style={{ whiteSpace: 'nowrap', userSelect: 'none' }}>Relationships of</Box>
            <Box flex={'1 0 auto'}>
              <SelectElement
                scope={scope}
                subject={subject.element}
                onSelect={fqn =>
                  overlay.openOverlay({
                    relationshipsOf: fqn
                  })}
                viewId={view.id} />
            </Box>
            <SegmentedControl
              flex={'1 0 auto'}
              size="xs"
              withItemsBorders={false}
              value={scope}
              onChange={setScope as any}
              data={[
                { label: 'Global', value: 'global' },
                { label: 'Current view', value: 'view', disabled: !viewIncludesSubject }
              ]}
            />
            {showSubjectWarning && (
              <Box
                pos={'absolute'}
                top={'calc(100% + .5rem)'}
                left={'50%'}
                w={'max-content'}
                style={{
                  transform: 'translateX(-50%)',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  setScope('global')
                }}
              >
                <Text fw={500} size="xs" c="orange" component="div">
                  Current view doesn't include this element, switched to Global
                </Text>
              </Box>
            )}
            {viewIncludesSubject && scope === 'view' && notIncludedRelations > 0 && (
              <Box
                pos={'absolute'}
                top={'calc(100% + .5rem)'}
                left={'50%'}
                w={'max-content'}
                style={{
                  transform: 'translateX(-50%)',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  setScope('global')
                }}
              >
                <Text fw={500} size="xs" c="orange" component="div">
                  View does not include {notIncludedRelations}{' '}
                  relationship{notIncludedRelations > 1 ? 's' : ''}. Switch to Global to compare
                </Text>
              </Box>
            )}
          </Group>
          <Button
            rightSection={<IconArrowRight stroke={3} size={14} />}
            color="dimmed"
            variant="subtle"
            style={{
              visibility: current + 1 < history.length ? 'visible' : 'hidden',
              padding: '0.25rem 0.75rem'
            }}
            styles={{
              label: {
                fontWeight: 400
              },
              section: {
                marginInlineStart: 4
              }
            }}
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              historyOps.forward()
            }}>
            Forward
          </Button>
        </Group>
      </Panel>
    </RelationshipsXYFlow>
  )
})
