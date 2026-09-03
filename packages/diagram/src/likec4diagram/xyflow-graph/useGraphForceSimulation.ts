import type { OnNodeDrag } from '@xyflow/react'
import {
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
} from 'd3-force'
import { useEffect, useMemo, useRef } from 'react'
import { useDiagram } from '../../hooks/useDiagram'
import type { Types } from '../types'
import { GraphNodeDiameter } from './graph-view-to-xy'

type SimNode = SimulationNodeDatum & {
  id: string
  /**
   * Anchor position (the node's layouted center) - a weak force pulls the node back
   * towards it, so the simulation settles close to the original topology instead of drifting.
   */
  homeX: number
  homeY: number
}
type SimLink = SimulationLinkDatum<SimNode>

const radius = GraphNodeDiameter / 2

/**
 * Builds the d3-force graph (nodes seeded at their current center, links between existing nodes
 * only) from the "graph" variant's xynodes/xyedges.
 *
 * Exported as a pure function so it can be unit-tested without a render harness - this package
 * has no `renderHook` infrastructure, so hook effects themselves stay untested; this is the part
 * of the hook worth covering in isolation (id-based link resolution, dropping hidden/dangling
 * refs is exactly what would otherwise blow up inside d3-force with a cryptic error).
 */
export function buildSimGraph(
  graphNodes: readonly Types.GraphElementNode[],
  graphEdges: readonly Types.RelationshipEdge[],
): { nodes: SimNode[]; links: SimLink[] } {
  const nodes: SimNode[] = graphNodes.map(xynode => {
    const homeX = xynode.position.x + radius
    const homeY = xynode.position.y + radius
    return { id: xynode.id, x: homeX, y: homeY, homeX, homeY }
  })
  const nodeIds = new Set(nodes.map(n => n.id))
  const links: SimLink[] = graphEdges
    .filter(e => nodeIds.has(e.source) && nodeIds.has(e.target))
    .map(e => ({ source: e.source, target: e.target }))
  return { nodes, links }
}

type GraphForceHandlers = {
  onNodeDragStart: OnNodeDrag<Types.Node>
  onNodeDrag: OnNodeDrag<Types.Node>
  onNodeDragStop: OnNodeDrag<Types.Node>
}

/**
 * Runs a d3-force simulation for the "graph" display variant of element views, so switching
 * into it (and dragging nodes around) feels alive - nodes repel each other, edges act as
 * springs, and everything settles back with a bit of bounce (similar to Structurizr's Explore).
 *
 * Positions are pushed through the same `xyflow.applyChanges` channel as a regular node drag,
 * so they stay in sync with the rest of the diagram state instead of drifting out of it.
 */
export function useGraphForceSimulation({ enabled, nodes: xynodes, edges: xyedges }: {
  enabled: boolean
  nodes: Types.Node[]
  edges: Types.Edge[]
}): GraphForceHandlers {
  const diagram = useDiagram()
  const simulationRef = useRef<Simulation<SimNode, SimLink> | undefined>(undefined)

  const graphNodes = useMemo(
    () => xynodes.filter((n): n is Types.GraphElementNode => n.type === 'graph-element' && !n.hidden),
    [xynodes],
  )
  const graphEdges = useMemo(
    () => xyedges.filter((e): e is Types.RelationshipEdge => e.type === 'relationship'),
    [xyedges],
  )
  // Switching into "graph" mode is not synchronous - `elementViewVariant` flips first, and the
  // graph-element nodes/edges arrive a render or two later (view re-conversion is dispatched via
  // a raised event). Re-seed the simulation once that population actually settles, identified by
  // its node ids, instead of on every `enabled`/array-identity change (which would also fire on
  // the still-empty intermediate render, or reset the simulation on unrelated re-renders).
  const graphNodeIdsKey = useMemo(() => graphNodes.map(n => n.id).sort().join(','), [graphNodes])

  useEffect(() => {
    if (!enabled || graphNodes.length === 0) {
      simulationRef.current?.stop()
      simulationRef.current = undefined
      return
    }

    const { nodes, links } = buildSimGraph(graphNodes, graphEdges)

    const simulation = forceSimulation(nodes)
      .force('charge', forceManyBody().strength(-150))
      .force('link', forceLink<SimNode, SimLink>(links).id(n => n.id).distance(80).strength(0.4))
      .force('collide', forceCollide(radius + 10))
      .force('x', forceX<SimNode>(n => n.homeX).strength(0.06))
      .force('y', forceY<SimNode>(n => n.homeY).strength(0.06))
      .alphaDecay(0.02)
      .on('tick', () => {
        diagram.send({
          type: 'xyflow.applyChanges',
          nodes: nodes.map(n => ({
            id: n.id,
            type: 'position',
            position: { x: (n.x ?? n.homeX) - radius, y: (n.y ?? n.homeY) - radius },
            dragging: n.fx != null || n.fy != null,
          })),
        })
      })

    simulationRef.current = simulation

    return () => {
      simulation.stop()
      simulationRef.current = undefined
    }
    // oxlint-disable-next-line exhaustive-deps
  }, [enabled, graphNodeIdsKey])

  return useMemo((): GraphForceHandlers => ({
    onNodeDragStart: (_event, xynode) => {
      const simulation = simulationRef.current
      if (!simulation || xynode.type !== 'graph-element') {
        return
      }
      const simNode = simulation.nodes().find(n => n.id === xynode.id)
      if (!simNode) {
        return
      }
      simNode.fx = xynode.position.x + radius
      simNode.fy = xynode.position.y + radius
      simulation.alphaTarget(0.3).restart()
    },
    onNodeDrag: (_event, xynode) => {
      const simulation = simulationRef.current
      if (!simulation || xynode.type !== 'graph-element') {
        return
      }
      const simNode = simulation.nodes().find(n => n.id === xynode.id)
      if (!simNode) {
        return
      }
      simNode.fx = xynode.position.x + radius
      simNode.fy = xynode.position.y + radius
    },
    onNodeDragStop: (_event, xynode) => {
      const simulation = simulationRef.current
      if (!simulation || xynode.type !== 'graph-element') {
        return
      }
      const simNode = simulation.nodes().find(n => n.id === xynode.id)
      if (simNode) {
        // Let it spring back and settle instead of staying pinned where the pointer was released
        simNode.fx = null
        simNode.fy = null
      }
      simulation.alphaTarget(0)
    },
  }), [])
}
