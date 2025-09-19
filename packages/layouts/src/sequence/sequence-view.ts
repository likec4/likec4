import {
  type DiagramNode,
  type LayoutedDynamicView,
  getParallelStepsPrefix,
  isStepEdgeId,
} from '@likec4/core/types'
import { DefaultMap, invariant, nonNullable } from '@likec4/core/utils'
import { hasAtLeast } from 'remeda'
import type { SequenceActor, SequenceActorStepPort, SequenceViewLayout, Step } from './_types'
import {
  CONTINUOUS_OFFSET,
} from './const'
import { SequenceViewLayouter } from './layouter'
import { buildCompounds } from './utils'

type Port = {
  step: Step
  row: number
  type: 'source' | 'target'
  position: 'left' | 'right' | 'top' | 'bottom'
}

export function calcSequenceLayout(view: LayoutedDynamicView): SequenceViewLayout {
  const actors = [] as Array<DiagramNode>
  const actorPorts = new DefaultMap<DiagramNode, Port[]>(() => [])

  const steps = [] as Array<Step>

  const getNode = (id: string) => nonNullable(view.nodes.find(n => n.id === id))
  const parentsLookup: DefaultMap<DiagramNode, DiagramNode[]> = new DefaultMap(
    key => {
      const parent = key.parent ? getNode(key.parent) : null
      if (parent) {
        return [parent, ...parentsLookup.get(parent)]
      }
      return []
    },
  )

  const addActor = (...[source, target]: [DiagramNode, DiagramNode]) => {
    // source actor not yet added
    if (!actors.includes(source)) {
      const indexOfTarget = actors.indexOf(target)
      if (indexOfTarget > 0) {
        actors.splice(indexOfTarget, 0, source)
      } else {
        actors.push(source)
      }
    }
    if (!actors.includes(target)) {
      actors.push(target)
    }
  }

  let row = 0

  for (const edge of view.edges.filter(e => isStepEdgeId(e.id))) {
    const prevStep = steps.at(-1)
    const source = getNode(edge.source)
    const target = getNode(edge.target)

    if (source.children.length || target.children.length) {
      console.error('Sequence view does not support nested actors')
      continue
    }

    let sourceColumn = actors.indexOf(source)
    let targetColumn = actors.indexOf(target)

    const alreadyAdded = sourceColumn >= 0 && targetColumn >= 0

    if (!alreadyAdded) {
      if (edge.dir === 'back') {
        addActor(target, source)
      } else {
        addActor(source, target)
      }
      sourceColumn = actors.indexOf(source)
      targetColumn = actors.indexOf(target)
    }

    const isSelfLoop = source === target
    const isBack = sourceColumn > targetColumn
    const parallelPrefix = getParallelStepsPrefix(edge.id)

    let isContinuing = false
    if (prevStep && prevStep.target == source && prevStep.parallelPrefix === parallelPrefix) {
      isContinuing = prevStep.isSelfLoop !== isSelfLoop || prevStep.isBack === isBack
    }

    if (!isContinuing) {
      row++
    }

    const step: Step = {
      id: edge.id,
      from: {
        column: sourceColumn,
        row,
      },
      to: {
        column: targetColumn,
        row: isSelfLoop ? ++row : row,
      },
      edge,
      isSelfLoop,
      isBack,
      parallelPrefix,
      offset: isContinuing ? (prevStep?.offset ?? 0) + CONTINUOUS_OFFSET : 0,
      source,
      target,
      label: edge.labelBBox
        ? {
          height: edge.labelBBox.height + 8 + (edge.navigateTo ? 20 : 0),
          width: edge.labelBBox.width + 16,
          text: edge.label,
        }
        : null,
    }
    steps.push(step)
    actorPorts.get(source).push({ step, row, type: 'source', position: isBack && !isSelfLoop ? 'left' : 'right' })
    actorPorts.get(target).push({ step, row, type: 'target', position: isBack || isSelfLoop ? 'right' : 'left' })
  }

  // Update columns, as actors may have been re-ordered
  for (const step of steps) {
    step.from.column = actors.indexOf(step.source)
    step.to.column = actors.indexOf(step.target)
  }

  invariant(hasAtLeast(actors, 1), 'actors array must not be empty')

  const layout = new SequenceViewLayouter({
    actors,
    steps,
    compounds: buildCompounds(actors, view.nodes),
  })

  const bounds = layout.getViewBounds()

  return {
    id: view.id,
    actors: actors.map(actor => toSeqActor({ actor, ports: actorPorts.get(actor), layout })),
    compounds: layout.getCompoundBoxes().map(({ node, ...box }) => ({ ...box, id: node.id })),
    parallelAreas: layout.getParallelBoxes(),
    bounds,
  }
}

function toSeqActor({ actor, ports, layout }: {
  actor: DiagramNode
  ports: Port[]
  layout: SequenceViewLayouter
}): SequenceActor {
  const { x, y, width, height } = layout.getActorBox(actor)
  return {
    id: actor.id,
    x,
    y,
    width,
    height,
    ports: ports.map((p): SequenceActorStepPort => {
      const bbox = layout.getPortCenter(p.step, p.type)
      return ({
        id: p.step.id,
        cx: bbox.cx - x,
        cy: bbox.cy - y,
        height: bbox.height,
        type: p.type,
        position: p.position,
      })
    }),
  }
}
