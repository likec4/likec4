/**
 * Hardens the result of JSON.stringify when that literal is pasted into generated JS
 * (e.g. dynamic import). JSON escaping alone is insufficient for script/HTML breakout
 * (CodeQL: js/bad-code-sanitization, CWE-94 / CWE-116).
 *
 * We avoid rewriting generic backslashes here so valid JSON escape sequences from
 * JSON.stringify stay intact. Script breakouts use replaceAll; replacements encode
 * backslash as U+005C so we do not double-escape JSON output.
 */
function isJsonStringifyOutput(s: string): boolean {
  if (s.length === 0) {
    return false
  }
  try {
    JSON.parse(s)
    return true
  } catch {
    return false
  }
}

export function hardenJsonStringLiteralForEmbeddedScript(jsonStringified: string): string {
  if (typeof jsonStringified !== 'string') {
    throw new TypeError(
      'hardenJsonStringLiteralForEmbeddedScript: expected JSON.stringify(...) output as a string',
    )
  }
  if (!isJsonStringifyOutput(jsonStringified)) {
    throw new TypeError(
      'hardenJsonStringLiteralForEmbeddedScript: expected JSON.stringify(...) output (string, object, array, number, boolean, or null)',
    )
  }
  return jsonStringified
    .replaceAll('<', '\u005Cu003C')
    .replaceAll('>', '\u005Cu003E')
    .replaceAll('/', '\u005Cu002F')
    .replaceAll('\u2028', '\u005C' + 'u2028')
    .replaceAll('\u2029', '\u005C' + 'u2029')
}
