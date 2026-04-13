/**
 * Intercepts clicks on external links (<a href="https://...">) and routes them
 * through a callback instead of allowing default navigation.
 *
 * In VSCode webviews, default link navigation shows a blank page.
 * This handler catches http(s) links and delegates to the extension host
 * via vscode.env.openExternal() (#2422).
 */

const isHttpUrl = /^https?:\/\//i

export function handleExternalLinkClick(
  e: MouseEvent,
  openExternalUrl: (url: string) => void,
): void {
  const target = e.target
  if (!target || typeof (target as Element).closest !== 'function') return
  const anchor = (target as Element).closest('a[href]')
  if (!anchor) return
  const href = anchor.getAttribute('href')
  if (href && isHttpUrl.test(href)) {
    e.preventDefault()
    openExternalUrl(href)
  }
}

export function interceptExternalLinks(
  openExternalUrl: (url: string) => void,
  target: Pick<Document, 'addEventListener' | 'removeEventListener'> = document,
): () => void {
  const handler = (e: Event) => handleExternalLinkClick(e as MouseEvent, openExternalUrl)

  target.addEventListener('click', handler)
  target.addEventListener('auxclick', handler)

  return () => {
    target.removeEventListener('click', handler)
    target.removeEventListener('auxclick', handler)
  }
}
