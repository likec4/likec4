/**
 * Intercepts clicks on external links (<a href="https://...">) and routes them
 * through a callback instead of allowing default navigation.
 *
 * In VSCode webviews, default link navigation shows a blank page.
 * This handler catches http(s) links and delegates to the extension host
 * via vscode.env.openExternal() (#2422).
 *
 * Left-click uses capture phase so it fires before React's event system
 * can stop propagation (React 18+ attaches at the root, and diagram
 * components use stopPropagation() on click events). Without capture,
 * left-clicks on links inside element details overlays never reach the
 * document-level handler.
 */

const isHttpUrl = /^https?:\/\//i

/** Interactive elements that should handle their own clicks, even inside <a> tags. */
const interactiveSelector = 'button, [role="button"], input, select, textarea'

export function handleExternalLinkClick(
  e: MouseEvent,
  openExternalUrl: (url: string) => void,
): void {
  const target = e.target
  if (!target || typeof (target as Element).closest !== 'function') return

  const el = target as Element

  // Skip interactive elements (e.g., copy button inside a link badge),
  // but still prevent anchor navigation to avoid the webview blank-page bug.
  // The interceptor owns "no blank-page navigation" — components shouldn't
  // need webview-awareness.
  if (el.closest(interactiveSelector)) {
    const anchor = el.closest('a[href]')
    if (anchor) {
      const href = anchor.getAttribute('href')
      if (href && isHttpUrl.test(href)) {
        e.preventDefault()
      }
    }
    return
  }

  const anchor = el.closest('a[href]')
  if (!anchor) return
  const href = anchor.getAttribute('href')
  if (href && isHttpUrl.test(href)) {
    e.preventDefault()
    e.stopPropagation()
    openExternalUrl(href)
  }
}

export function interceptExternalLinks(
  openExternalUrl: (url: string) => void,
  target: Pick<Document, 'addEventListener' | 'removeEventListener'> = document,
): () => void {
  const handler = (e: Event) => handleExternalLinkClick(e as MouseEvent, openExternalUrl)

  // Use capture phase for click so the handler fires before React's
  // event system can stopPropagation(). auxclick doesn't need capture
  // because React doesn't handle non-primary button clicks.
  target.addEventListener('click', handler, true)
  target.addEventListener('auxclick', handler)

  return () => {
    target.removeEventListener('click', handler, true)
    target.removeEventListener('auxclick', handler)
  }
}
