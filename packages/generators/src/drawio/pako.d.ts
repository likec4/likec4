declare module 'pako' {
  export function deflateRaw(
    data: Uint8Array,
    options?: { level?: number },
  ): Uint8Array
  export function inflateRaw(data: Uint8Array): Uint8Array
  export function inflateRaw(data: Uint8Array, options: { to: 'string' }): string
}
