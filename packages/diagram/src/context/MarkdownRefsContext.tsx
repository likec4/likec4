import type { Fqn, ViewId } from '@likec4/core/types'
import { createContext, useContext } from 'react'

/**
 * Actions for links to elements and views in Markdown (`[[fqn]]`, `[[view:id]]`).
 * A `null` action means the respective refs are rendered as plain text.
 */
export type MarkdownRefActions = {
  openElement: ((fqn: Fqn) => void) | null
  openView: ((viewId: ViewId) => void) | null
}

const MarkdownRefsContext = createContext<MarkdownRefActions | null>(null)
MarkdownRefsContext.displayName = 'MarkdownRefsContext'

/**
 * Makes refs in nested `Markdown` interactive (links with tooltips).
 * Without this provider (e.g. inside diagram nodes on the canvas) refs are rendered as text.
 */
export const MarkdownRefsProvider = MarkdownRefsContext.Provider

/**
 * @returns Actions for refs in Markdown, or null if refs are not interactive here
 */
export function useMarkdownRefActions(): MarkdownRefActions | null {
  return useContext(MarkdownRefsContext)
}
