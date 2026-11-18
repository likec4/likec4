/**
 * Escapes characters inside serialized JSON so embedding inside a `<script type="application/json">`
 * element cannot prematurely terminate the script tag or introduce JS line terminators.
 */
export function escapeJsonForScript(json: string): string {
  return json
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

/**
 * Serializes a value as JSON safe for embedding inside an inline `<script type="application/json">`.
 */
export function jsonForScript(value: unknown): string {
  return escapeJsonForScript(JSON.stringify(value) ?? 'null')
}

/**
 * Escapes text for use inside an HTML attribute or element text node.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
