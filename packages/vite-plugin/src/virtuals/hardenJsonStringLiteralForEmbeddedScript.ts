/**
 * Hardens the result of JSON.stringify when that literal is pasted into generated JS
 * (e.g. dynamic import). JSON escaping alone is insufficient for script/HTML breakout
 * (CodeQL: js/bad-code-sanitization, CWE-94 / CWE-116).
 *
 * We avoid rewriting generic backslashes here so valid JSON escape sequences from
 * JSON.stringify stay intact.
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
    .replace(/</g, '\\u003C')
    .replace(/>/g, '\\u003E')
    .replace(/\//g, '\\u002F')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}
