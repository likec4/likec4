import { type DiagramNode, type EdgeId, type LayoutedDynamicView, isStepEdgeId } from '@likec4/core/types'
import { DefaultMap, nonNullable } from '@likec4/core/utils'
import { MarkerType } from '@xyflow/system'
import type { SequenceViewTypes } from './_types'

type Step = {
  id: EdgeId
  from: {
    column: number
    row: number
  }
  to: {
    column: number
    row: number
  }
  source: DiagramNode
  target: DiagramNode
  label: null | {
    height: number
    width: number
    text: string
  }
}

export function toSequenceView(dynamicView: LayoutedDynamicView): {
  xynodes: Array<SequenceViewTypes.Node>
  xyedges: Array<SequenceViewTypes.Edge>
} {
  const actors = [] as Array<DiagramNode>
  const actorPorts = new DefaultMap<DiagramNode, {
    in: Array<{
      step: Step
      row: number
    }>
    out: Array<{
      step: Step
      row: number
    }>
  }>(() => ({ in: [], out: [] }))

  const steps = [] as Array<Step>

  // const stepActions = [] as Array<null | { label: string; height: number; width: number }>

  const getNode = (id: string) => nonNullable(dynamicView.nodes.find(n => n.id === id))

  const addActor = (...newActors: DiagramNode[]) => {
    for (const actor of newActors) {
      if (!actors.includes(actor)) {
        actors.push(actor)
      }
    }
  }

  let row = 0
  let prevStep: Step | null = null

  for (const { id, ..._step } of dynamicView.edges.filter(e => isStepEdgeId(e.id))) {
    const source = getNode(_step.source)
    const target = getNode(_step.target)
    if (_step.dir === 'back') {
      addActor(target, source)
    } else {
      addActor(source, target)
    }

    if (prevStep && prevStep.target !== source) {
      row++
    }

    const step: Step = {
      id,
      from: {
        column: actors.indexOf(source),
        row,
      },
      to: {
        column: actors.indexOf(target),
        row,
      },
      source,
      target,
      label: _step.labelBBox && _step.label
        ? {
          height: _step.labelBBox.height + 32,
          width: _step.labelBBox.width + 32,
          text: _step.label,
        }
        : null,
    }
    prevStep = step
    steps.push(step)

    actorPorts.get(source).out.push({ step, row })
    actorPorts.get(target).in.push({ step, row })
  }

  const columnWidth = 120
  const totalRows = row + 1
  const totalHeight = totalRows * 32

  return {
    xynodes: actors.map((actor, index) => {
      const ports = actorPorts.get(actor)
      return ({
        id: actor.id,
        type: 'actor',
        data: {
          title: actor.title,
          ports: {
            totalRows,
            in: ports.in.map(p => ({
              step: p.step.id,
              row: p.row,
            })),
            out: ports.out.map(p => ({
              step: p.step.id,
              row: p.row,
            })),
          },
        },
        position: {
          x: index * (columnWidth + 16),
          y: 0,
        },
        width: columnWidth,
        height: totalHeight,
      })
    }),
    xyedges: steps.map(step => ({
      id: step.id,
      type: 'step',
      data: {},
      source: step.source.id,
      sourceHandle: step.id,
      target: step.target.id,
      targetHandle: step.id,
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
    })),
  }
}
