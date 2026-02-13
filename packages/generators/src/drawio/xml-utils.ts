/**
 * Shared XML escape/decode for DrawIO generate and parse.
 * Single place so escaping rules stay in sync (Clean Code 8.5.2).
 */

/** Escape for use inside XML attributes and text. */
export function escapeXml(unsafe: string): string {
  return unsafe
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&apos;')
}

/** Decode XML entities (inverse of escapeXml for the five standard entities). */
export function decodeXmlEntities(s: string): string {
  return s
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', '\'')
    .replaceAll('&amp;', '&')
}
