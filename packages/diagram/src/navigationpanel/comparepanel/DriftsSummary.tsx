import type {
  DiagramEdgeDriftReason,
  DiagramNodeDriftReason,
  EdgeId,
  LayoutedView,
  LayoutedViewDriftReason,
  LayoutType,
  NodeId,
  NonEmptyReadonlyArray,
} from '@likec4/core/types'
import { deepEqual } from 'fast-equals'

import { nonNullable, sortNaturalByFqn } from '@likec4/core/utils'
import { css } from '@likec4/styles/css'
import { HStack, styled, Txt } from '@likec4/styles/jsx'
import { hstack, vstack } from '@likec4/styles/patterns'
import { useDebouncedCallback } from '@mantine/hooks'
import { IconChevronRight } from '@tabler/icons-react'
import type { MouseEvent, MouseEventHandler } from 'react'
import { difference, filter, hasAtLeast, map, pipe } from 'remeda'
import {
  selectDiagramContext,
  useCallbackRef,
  useDiagram,
  useDiagramSelector,
} from '../../hooks'

const hasDrifts = <
  T,
  E,
>(item: E & { drifts?: ReadonlyArray<T> | null | undefined }): item is E & { drifts: NonEmptyReadonlyArray<T> } => {
  return !!item.drifts && hasAtLeast(item.drifts, 1)
}

const edgeEndpoint = (view: LayoutedView, nodeId: NodeId) => {
  const nd = nonNullable(view.nodes.find(n => n.id === nodeId), `Edge endpoint "${nodeId}" not found`)
  return {
    id: nd.id,
    title: nd.title,
  }
}

const filterViewDrifts = <D extends readonly LayoutedViewDriftReason[]>(drifts: D, layout: LayoutType = 'auto') => {
  const sharedDrifts = ['edges-drift', 'nodes-drift'] as const
  // If layout is manual, return all drifts
  if (layout === 'manual') {
    return difference(
      drifts,
      // We show what nodes/edges were removed, no need to show same as view drifts
      [...sharedDrifts, 'edges-removed', 'nodes-removed'] satisfies LayoutedViewDriftReason[],
    )
  }
  // If layout is auto, filter out
  return difference(
    drifts,
    // We show what nodes/edges were added, no need to show same as view drifts
    [...sharedDrifts, 'edges-added', 'nodes-added'] satisfies LayoutedViewDriftReason[],
  )
}

const selectDrifts = selectDiagramContext(ctx => ({
  layout: ctx.view._layout ?? 'auto',
  view: filterViewDrifts(ctx.view.drifts ?? [], ctx.view._layout),
  nodes: pipe(
    ctx.view.nodes,
    filter(hasDrifts),
    map(n => ({
      id: n.id,
      title: n.title,
      drifts: n.drifts,
    })),
    sortNaturalByFqn(),
  ),
  edges: pipe(
    ctx.view.edges,
    filter(hasDrifts),
    map(e => ({
      id: e.id,
      label: e.label,
      source: edgeEndpoint(ctx.view, e.source),
      target: edgeEndpoint(ctx.view, e.target),
      drifts: e.drifts,
    })),
  ),
}), deepEqual)

type Handlers = {
  onMouseEnter: MouseEventHandler
  onMouseLeave: MouseEventHandler
  onClick?: MouseEventHandler
}

export function DriftsSummary() {
  const selected = useDiagramSelector(selectDrifts)

  const diagram = useDiagram()

  const onMouseLeaveDebounced = useDebouncedCallback(
    (e: MouseEvent) => {
      e.stopPropagation()
      diagram.unhighlightAll()
    },
    250,
  )

  const onMouseEnter: MouseEventHandler = useCallbackRef((e) => {
    const target = e.currentTarget.getAttribute('data-drift-type')
    const id = e.currentTarget.getAttribute('data-drift-id')
    if (target === 'node' && id) {
      e.stopPropagation()
      onMouseLeaveDebounced.cancel()
      diagram.highlightNode(id as NodeId)
      return
    }
    if (target === 'edge' && id) {
      e.stopPropagation()
      onMouseLeaveDebounced.cancel()
      diagram.highlightEdge(id as EdgeId)
      return
    }
  })

  const onClick: MouseEventHandler = useCallbackRef((e) => {
    const target = e.currentTarget.getAttribute('data-drift-type')
    const id = e.currentTarget.getAttribute('data-drift-id')
    if (target === 'node' && id) {
      e.stopPropagation()
      diagram.centerViewportOnNode(id as NodeId)
      return
    }
    if (target === 'edge' && id) {
      e.stopPropagation()
      diagram.centerViewportOnEdge(id as EdgeId)
      return
    }
  })

  const handlers = {
    onMouseEnter,
    onMouseLeave: onMouseLeaveDebounced as MouseEventHandler,
    onClick,
  }

  const { view, nodes, edges } = selected
  const hasViewDrifts = hasAtLeast(view, 1)
  const hasNodeDrifts = hasAtLeast(nodes, 1)
  const hasEdgeDrifts = hasAtLeast(edges, 1)

  const hasDrifts = hasViewDrifts || hasNodeDrifts || hasEdgeDrifts

  if (!hasDrifts) {
    return null
  }

  return (
    <div
      className={vstack({
        flex: '1',
        height: '100%',
        gap: '0',
        overflow: 'scroll',
      })}
    >
      {hasViewDrifts && (
        <>
          <SectionHeader key="view-drifts-header">View:</SectionHeader>
          <HStack key="view-drifts" flexWrap="wrap" my="3" pl="3">
            {map(
              view,
              (drift) => <DriftKind key={`view-${drift}`} variant={driftVariant(drift)}>{drift}</DriftKind>,
            )}
          </HStack>
        </>
      )}
      {hasNodeDrifts && (
        <>
          <SectionHeader key="nodes-section">Elements</SectionHeader>
          {map(
            nodes,
            (node) => <NodeDrifts key={node.id} node={node} {...handlers} />,
          )}
        </>
      )}
      {hasEdgeDrifts && (
        <>
          <SectionHeader key="edges-section">Relationships</SectionHeader>
          {map(edges, (edge) => <EdgeDrifts key={edge.id} edge={edge} {...handlers} />)}
        </>
      )}
    </div>
  )
}

function NodeDrifts(
  { node: { id, title, drifts }, ...handlers }: {
    node: typeof selectDrifts.Out['nodes'][number]
  } & Handlers,
) {
  const key = `node-drifts-${id}`
  return (
    <DriftsGroup
      key={key}
      data-drift-type="node"
      data-drift-id={id}
      {...handlers}>
      <Txt
        truncate
        css={{
          flex: 'auto',
        }}
        fontSize={'xs'}
        lineHeight={'sm'}>
        {title}
      </Txt>

      {map(
        drifts,
        (drift) => <DriftKind key={key + drift} variant={driftVariant(drift)}>{drift}</DriftKind>,
      )}
    </DriftsGroup>
  )
}

function EdgeDrifts({ edge: { id, source, target, drifts }, ...handlers }: {
  edge: typeof selectDrifts.Out['edges'][number]
} & Handlers) {
  const key = `edge-drifts-${id}`
  return (
    <DriftsGroup
      key={key}
      data-drift-type="edge"
      data-drift-id={id}
      {...handlers}
    >
      <HStack
        css={{
          gap: '0.5',
          flex: 'auto',
          justifyContent: 'stretch',
          flexWrap: 'nowrap',
        }}>
        <Txt size="xs" lh="sm" truncate>
          {source.title}
        </Txt>
        <IconChevronRight size={12} className={css({ color: 'text.dimmed' })} />
        <Txt size="xs" lh="sm" truncate>
          {target.title}
        </Txt>
      </HStack>
      {map(
        drifts,
        (drift) => <DriftKind key={key + drift} variant={driftVariant(drift)}>{drift}</DriftKind>,
      )}
    </DriftsGroup>
  )
}

const DriftsGroup = styled('div', {
  base: hstack.raw({
    width: 'full',
    flex: '1',
    gap: '2',
    rowGap: '2',
    pl: '3',
    pr: '2',
    pt: '2',
    pb: '3',
    cursor: 'default',
    flexWrap: 'wrap',
    _hover: {
      backgroundColor: 'surface.hover',
    },
    '& + &': {
      borderTop: 'none',
    },
  }),
}, {
  defaultProps: {
    className: 'group',
  },
})

const SectionHeader = styled('div', {
  base: {
    userSelect: 'none',
    fontWeight: 'medium',
    textStyle: 'fieldLabel',
    color: 'text.dimmed',
    backgroundColor: 'surface.sunken',
    pl: '3',
    py: '1',
    borderTop: 'subtle',
  },
})

function driftVariant(
  drift: LayoutedViewDriftReason | DiagramEdgeDriftReason | DiagramNodeDriftReason,
): 'added' | 'modified' | 'removed' {
  switch (drift) {
    case 'edges-removed':
    case 'nodes-removed':
    case 'removed':
      return 'removed'
    case 'added':
    case 'nodes-added':
    case 'edges-added':
      return 'added'
    default:
      return 'modified'
  }
}

const DriftKind = styled('div', {
  base: {
    flexGrow: 0,
    flexShrink: 0,
    flex: 'auto',
    display: 'block',
    fontSize: '[8px]',
    fontFamily: 'mono',
    fontWeight: 'medium',
    px: '1',
    rounded: 'xs',
    border: 'subtle',
  },
  variants: {
    variant: {
      removed: {
        color: 'likec4.diff.removed',
        backgroundColor: 'likec4.diff.removed/5',
        borderColor: 'likec4.diff.removed/40',
        _groupHover: {
          backgroundColor: 'likec4.diff.removed/10',
        },
      },
      added: {
        color: 'likec4.diff.added',
        backgroundColor: 'likec4.diff.added/5',
        borderColor: 'likec4.diff.added/40',
        _groupHover: {
          backgroundColor: 'likec4.diff.added/15',
        },
      },
      modified: {
        color: 'likec4.diff.modified',
        backgroundColor: 'likec4.diff.modified/5',
        borderColor: 'likec4.diff.modified/40',
        _groupHover: {
          backgroundColor: 'likec4.diff.modified/15',
        },
      },
    },
  },
  defaultVariants: {
    variant: 'modified',
  },
})
