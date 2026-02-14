/**
 * Shared XML escape/decode for DrawIO generate and parse.
 * Single place so escaping rules stay in sync (Clean Code 8.5.2).
 */

/**
 * Escape for use inside XML attributes and text.
 * @param unsafe - Raw string that may contain &, <, >, ", '
 * @returns XML-safe string with entities escaped
 */
export function escapeXml(unsafe: string): string {
  return unsafe
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&apos;')
}

/**
 * Decode XML entities (inverse of escapeXml for the five standard entities).
 * @param s - String with &lt; &gt; &quot; &apos; &amp;
 * @returns Decoded string
 */
export function decodeXmlEntities(s: string): string {
  return s
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', '\'')
    .replaceAll('&amp;', '&')
}
