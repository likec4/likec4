/**
 * Hardens the result of JSON.stringify when that literal is pasted into generated JS
 * (e.g. dynamic import). JSON escaping alone is insufficient for script/HTML breakout
 * (CodeQL: js/bad-code-sanitization, CWE-94 / CWE-116).
 *
 * We avoid rewriting generic backslashes here so valid JSON escape sequences from
 * JSON.stringify stay intact.
 */
export function hardenJsonStringLiteralForEmbeddedScript(jsonStringified: string): string {
  return jsonStringified
    .replace(/</g, '\\u003C')
    .replace(/>/g, '\\u003E')
    .replace(/\//g, '\\u002F')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}
