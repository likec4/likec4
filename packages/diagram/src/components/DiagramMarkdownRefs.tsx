import type { PropsWithChildren } from 'react'
import { MarkdownRefsProvider } from '../context/MarkdownRefsContext'
import { useDiagramMarkdownRefActions } from '../hooks/useDiagramMarkdownRefActions'

/**
 * Makes refs in nested `Markdown` clickable: element refs open element details, view refs navigate.
 * Use in overlays and panels, not in diagram nodes on the canvas.
 */
export function DiagramMarkdownRefs({ children }: PropsWithChildren) {
  const actions = useDiagramMarkdownRefActions()
  return <MarkdownRefsProvider value={actions}>{children}</MarkdownRefsProvider>
}
