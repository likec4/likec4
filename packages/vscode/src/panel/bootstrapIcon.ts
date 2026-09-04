const bootstrapIconName = /^[a-z0-9][a-z0-9-]{0,127}$/
const maxSvgBytes = 256 * 1024
const bootstrapIconUrl = (name: string) => `https://icons.like-c4.dev/bootstrap/${name}.svg`

export type BootstrapIconResult = { base64data: string | null }

export const isBootstrapIconName = (name: string) => bootstrapIconName.test(name)

export function createBootstrapIconLoader(fetcher: typeof fetch = fetch) {
  const cache = new Map<string, string>()

  return async (name: string): Promise<BootstrapIconResult> => {
    if (!isBootstrapIconName(name)) {
      return { base64data: null }
    }
    const cached = cache.get(name)
    if (cached) {
      return { base64data: cached }
    }
    try {
      const response = await fetcher(bootstrapIconUrl(name), { signal: AbortSignal.timeout(10_000) })
      const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''
      if (!response.ok || !contentType.startsWith('image/svg+xml')) {
        return { base64data: null }
      }
      const bytes = new Uint8Array(await response.arrayBuffer())
      if (bytes.byteLength > maxSvgBytes) {
        return { base64data: null }
      }
      const base64data = `data:image/svg+xml;base64,${Buffer.from(bytes).toString('base64')}`
      cache.set(name, base64data)
      return { base64data }
    } catch {
      return { base64data: null }
    }
  }
}
