/**
 * Hardens the result of JSON.stringify when that literal is pasted into generated JS
 * (e.g. dynamic import). JSON escaping alone is insufficient for script/HTML breakout
 * (CodeQL: js/bad-code-sanitization, CWE-94 / CWE-116).
 *
 * We avoid rewriting generic backslashes here so valid JSON escape sequences from
 * JSON.stringify stay intact. Script breakouts use replaceAll; replacements encode
 * backslash as U+005C so we do not double-escape JSON output.
 */
function looksLikeJsonStringifyOutput(s: string): boolean {
  if (s.length === 0) {
    return false
  }
  const first = s.charAt(0)
  if (first === '"' || first === '{' || first === '[') {
    return true
  }
  if (s === 'true' || s === 'false' || s === 'null') {
    return true
  }
  // JSON numbers: 0, -1, 1.5, 1e3, etc.
  return /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(s)
}

export function hardenJsonStringLiteralForEmbeddedScript(jsonStringified: string): string {
  if (typeof jsonStringified !== 'string') {
    throw new TypeError(
      'hardenJsonStringLiteralForEmbeddedScript: expected JSON.stringify(...) output as a string',
    )
  }
  if (!looksLikeJsonStringifyOutput(jsonStringified)) {
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
