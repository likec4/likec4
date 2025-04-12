import type { BBox, XYPoint } from '@likec4/core'
import type { ActorSystem } from 'xstate'
import type { OverlaysActorRef } from '../overlays/overlaysActor'
import type { Context } from './diagram-machine'
import type { DiagramActorRef, System } from './types'

export function typedSystem(system: ActorSystem<any>) {
  return {
    get overlaysActorRef(): OverlaysActorRef | null {
      return (system as System).get('overlays') ?? null
    },
    get diagramActorRef(): DiagramActorRef | null {
      return (system as System).get('diagram') ?? null
    },
  }
}

export function findDiagramNode(ctx: Context, xynodeId: string) {
  return ctx.view.nodes.find(n => n.id === xynodeId) ?? null
}

export function findDiagramEdge(ctx: Context, xyedgeId: string) {
  return ctx.view.edges.find(e => e.id === xyedgeId) ?? null
}

export function focusedBounds(params: { context: Context }): { bounds: BBox; duration?: number } {
  const knownAbsolutes = new Map<string, XYPoint>()

  const b = params.context.xynodes.reduce((acc, node) => {
    let position = node.position
    if (node.parentId) {
      const parent = knownAbsolutes.get(node.parentId) ?? { x: 0, y: 0 }
      position = {
        x: position.x + parent.x,
        y: position.y + parent.y,
      }
    }
    knownAbsolutes.set(node.id, position)

    if (node.hidden || node.data.dimmed) {
      return acc
    }

    const width = node.measured?.width ?? node.width ?? node.initialWidth
    const height = node.measured?.height ?? node.height ?? node.initialHeight
    return {
      minX: Math.min(acc.minX, position.x),
      minY: Math.min(acc.minY, position.y),
      maxX: Math.max(acc.maxX, position.x + width),
      maxY: Math.max(acc.maxY, position.y + height),
    }
  }, {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
  })

  if (b.minX === Infinity) {
    return {
      bounds: params.context.view.bounds,
    }
  }

  return {
    duration: 350,
    bounds: {
      x: b.minX - 10,
      y: b.minY - 10,
      width: b.maxX - b.minX + 20,
      height: b.maxY - b.minY + 20,
    },
  }
}
