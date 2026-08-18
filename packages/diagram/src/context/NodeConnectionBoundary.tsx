import type { PropsWithChildren } from 'react'
import { createContext, useContext } from 'react'

export type NodeConnectionBoundaryEnd = 'source' | 'target'

export interface NodeConnectionBoundaryRequest {
  /** React Flow id of the node whose boundary is being resolved. */
  nodeId: string
  /** Measured node bounds in diagram coordinates. */
  nodeBounds: Readonly<{
    x: number
    y: number
    width: number
    height: number
  }>
  /** Adjacent route point that the relationship travels toward. */
  toward: Readonly<{
    x: number
    y: number
  }>
  /** Whether the node is the relationship's source or target. */
  end: NodeConnectionBoundaryEnd
}

/**
 * Resolves where a relationship attaches to a custom-rendered node.
 *
 * Return `null` or `undefined` to use LikeC4's default node boundary.
 */
export type NodeConnectionBoundaryResolver = (
  request: NodeConnectionBoundaryRequest,
) => { x: number; y: number } | null | undefined

const NodeConnectionBoundaryContext = createContext<NodeConnectionBoundaryResolver | null>(null)

/**
 * Provides custom relationship attachment points for descendant diagrams.
 *
 * Use this with custom node renderers whose visible boundary differs from the
 * node's measured rectangular bounds.
 */
export function NodeConnectionBoundaryProvider({
  children,
  resolver,
}: PropsWithChildren<{
  resolver: NodeConnectionBoundaryResolver | null
}>) {
  return (
    <NodeConnectionBoundaryContext.Provider value={resolver}>
      {children}
    </NodeConnectionBoundaryContext.Provider>
  )
}

export function useNodeConnectionBoundaryResolver(): NodeConnectionBoundaryResolver | null {
  return useContext(NodeConnectionBoundaryContext)
}
