import type {
  DiagramEdgeDriftReason,
  DiagramNodeDriftReason,
  EdgeId,
  LayoutedViewDriftReason,
  NodeId,
  NonEmptyReadonlyArray,
} from '@likec4/core/types'
import { deepEqual } from 'fast-equals'

import { styled, Txt } from '@likec4/styles/jsx'
import { vstack } from '@likec4/styles/patterns'
import { useDebouncedCallback } from '@mantine/hooks'
import { type Variants, AnimatePresence, m, stagger } from 'motion/react'
import type { MouseEvent, MouseEventHandler } from 'react'
import { filter, hasAtLeast, map, pipe } from 'remeda'
import { selectDiagramActorContext, useCallbackRef, useDiagram, useDiagramSnapshot } from '../../hooks'

const hasDrifts = <
  E extends {
    drifts: ReadonlyArray<any> | null | undefined
  },
>(item: E): item is E & { drifts: NonEmptyReadonlyArray<any> } => {
  return !!item.drifts && hasAtLeast(item.drifts, 1)
}

const selectDrifts = selectDiagramActorContext(ctx => ({
  view: ctx.view.drifts ?? [],
  nodes: pipe(
    ctx.view.nodes,
    map(node => ({
      id: node.id,
      name: node.title,
      drifts: node.drifts,
    })),
    filter(hasDrifts),
  ),
  edges: pipe(
    ctx.view.edges,
    map(edge => ({
      edgeId: edge.id,
      drifts: edge.drifts,
    })),
    filter(hasDrifts),
  ),
}))

const variants = {
  initial: {
    opacity: 0,
    translateY: -8,
  },
  animate: {
    opacity: 1,
    translateY: 0,
    transition: {
      delayChildren: stagger(0.1),
    },
  },
  exit: {
    opacity: 0,
    translateY: -8,
    transition: {
      delayChildren: stagger(0.2, { startDelay: .5, from: 'last' }),
    },
  },
} satisfies Variants

type Handlers = {
  onMouseEnter: MouseEventHandler
  onMouseLeave: MouseEventHandler
  onClick?: MouseEventHandler
}

export function DriftsSummary() {
  const selected = useDiagramSnapshot(selectDrifts, deepEqual)

  const diagram = useDiagram()

  const onMouseLeaveDebounced = useDebouncedCallback(
    (e: MouseEvent) => {
      e.stopPropagation()
      diagram.unhighlightAll()
    },
    150,
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
  if (view.length === 0 && nodes.length === 0 && edges.length === 0) {
    return null
  }

  return (
    <AnimatePresence propagate mode="wait">
      <m.div
        key={`drifts-summary`}
        layout="size"
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        layoutDependency={selected}
        className={vstack({
          mx: '[calc({spacing.2} * -1)]',
          px: '2',
          flex: '1',
          height: '100%',
          overflow: 'scroll',
          gap: '4',
        })}
      >
        {hasAtLeast(view, 1) && <ViewDrifts drifts={view} />}
        {nodes.length > 0 && (
          <m.div key={`nodes-drifts`} layout="size">
            <SectionHeader>Elements:</SectionHeader>
            <m.div layout="size" className={vstack({ mt: '2', gap: '2' })}>
              {map(
                nodes,
                (node) => <NodeDrifts key={node.id} {...node} {...handlers} />,
              )}
            </m.div>
          </m.div>
        )}
        {edges.length > 0 && (
          <m.div key={`edges-drifts`} layout="size">
            <SectionHeader>Relationships:</SectionHeader>
            <m.div layout="size" className={vstack({ mt: '2', gap: '2' })}>
              {map(edges, (edge) => <EdgeDrifts key={edge.edgeId} {...edge} {...handlers} />)}
            </m.div>
          </m.div>
        )}
      </m.div>
    </AnimatePresence>
  )
}

function ViewDrifts({ drifts }: { drifts: NonEmptyReadonlyArray<LayoutedViewDriftReason> }) {
  return (
    <>
      <m.div
        key={`view-drifts-header`}
        layout="position"
        className={vstack({
          gap: '2',
        })}>
        <SectionHeader>View drifts (summary):</SectionHeader>
        <DriftsGroup key={`view-drifts`}>
          {map(drifts, (drift) => <DriftLabel key={drift}>{drift}</DriftLabel>)}
        </DriftsGroup>
      </m.div>
    </>
  )
}

function NodeDrifts(
  { id, name, drifts, ...handlers }: {
    id: NodeId
    name: string
    drifts: NonEmptyReadonlyArray<DiagramNodeDriftReason>
  } & Handlers,
) {
  return (
    <DriftsGroup
      key={`node-drifts-${id}`}
      data-drift-type="node"
      data-drift-id={id}
      {...handlers}
    >
      <Txt
        truncate
        css={{
          maxWidth: {
            base: 160,
            '@/sm': 180,
            '@/md': 250,
          },
        }}
        color={'likec4.compare.manual.outline'}
        fontSize={'xs'}
        lineHeight={'sm'}
        fontWeight={'medium'}>
        {name}
      </Txt>
      {map(drifts, (drift) => <DriftLabel key={id + drift}>{drift}</DriftLabel>)}
    </DriftsGroup>
  )
}

function EdgeDrifts({ edgeId, drifts, ...handlers }: {
  edgeId: EdgeId
  drifts: NonEmptyReadonlyArray<DiagramEdgeDriftReason>
} & Handlers) {
  return (
    <DriftsGroup
      key={`edge-drifts-${edgeId}`}
      data-drift-type="edge"
      data-drift-id={edgeId}
      {...handlers}
    >
      {map(drifts, (drift) => (
        <DriftLabel
          key={edgeId + drift}>
          {drift}
        </DriftLabel>
      ))}
    </DriftsGroup>
  )
}

const DriftsGroup = styled(m.div, {
  base: vstack.raw({
    gap: '1',
    px: '3',
    py: '2',
    cursor: 'default',
    rounded: 'sm',
    backgroundColor: 'likec4.compare.manual/10',
    border: '1px solid {colors.likec4.compare.manual.outline/20}',
    _hover: {
      backgroundColor: 'likec4.compare.manual/20',
      borderColor: 'likec4.compare.manual.outline/25',
    },
  }),
}, {
  defaultProps: {
    className: 'group',
    variants,
    layout: 'size',
    initial: 'initial',
    animate: 'animate',
    exit: 'exit',
  },
})

const SectionHeader = styled(m.div, {
  base: {
    userSelect: 'none',
    fontWeight: 'medium',
    textStyle: 'dimmed.xs',
    pl: '2',
  },
}, {
  defaultProps: {
    variants,
    layout: 'position',
    initial: 'initial',
    animate: 'animate',
    exit: 'exit',
  },
})

const DriftLabel = styled(m.div, {
  base: {
    userSelect: 'none',
    textStyle: 'xs',
    color: {
      base: 'text',
      _groupHover: 'text.bright',
    },
  },
}, {
  defaultProps: {
    variants,
    layout: 'position',
    initial: 'initial',
    animate: 'animate',
    exit: 'exit',
  },
})
