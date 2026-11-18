import type { HostData, HostOptions } from '../../markdown-protocol.ts'

export interface RootLike {
  render(node: unknown): void
  unmount(): void
}

export interface HostInput<M> {
  readonly host: Element
  readonly hostId: string
  readonly opts: HostOptions | null
  readonly data: HostData
  readonly model: M | null
}

export interface HostManagerDeps<M extends { hash: string }> {
  createRoot(container: Element): RootLike
  model(id: string): M | null
  view(input: HostInput<M>): unknown
  extraKey?(input: HostInput<M>): string
  shouldMount?(host: Element): boolean
}

interface HostEntry {
  root: RootLike
  shadow: ShadowRoot
  key: string | null
}

/**
 * Shadow-DOM stylesheet placed inside each `.likec4-view` host.
 * Ready state lives on `.likec4-root[data-ready]` inside the shadow root so VS Code's
 * `morphdom` reconciliation on the host element never clears it.
 */
export const HOST_STYLE = `
:host { display: block; position: relative; }
.likec4-root { position: absolute; top: 0; left: 0; width: 100%; visibility: hidden; }
.likec4-root[data-ready] { position: static; visibility: visible; }
.likec4-root[data-ready] + slot { display: none; }
`

export function markReady(host: Element): void {
  host.shadowRoot?.querySelector('.likec4-root')?.setAttribute('data-ready', '')
}

export function unmarkReady(host: Element): void {
  host.shadowRoot?.querySelector('.likec4-root')?.removeAttribute('data-ready')
}

export function isReady(host: Element): boolean {
  return Boolean(host.shadowRoot?.querySelector('.likec4-root[data-ready]'))
}

export function readJson<T>(el: Element | null): T | null {
  if (!el?.textContent) {
    return null
  }
  try {
    return JSON.parse(el.textContent) as T
  } catch {
    return null
  }
}

export class HostManager<M extends { hash: string }> {
  readonly entries = new Map<Element, HostEntry>()
  readonly deferred = new Set<Element>()
  renders = 0

  constructor(
    private readonly doc: Document,
    private readonly deps: HostManagerDeps<M>,
  ) {}

  scan(force = false): void {
    for (const host of Array.from(this.doc.querySelectorAll('.likec4-view'))) {
      const data = readJson<HostData>(host.querySelector(':scope > script[type="application/json"]'))
      if (!data) {
        continue
      }
      const optsRaw = host.getAttribute('data-likec4-opts')
      let opts: HostOptions | null = null
      try {
        opts = optsRaw ? (JSON.parse(optsRaw) as HostOptions) : null
      } catch {
        opts = null
      }

      const model = opts && (data.state === 'ok' || data.state === 'stale') ? this.deps.model(opts.model) : null
      const input: HostInput<M> = { host, hostId: host.id, opts, data, model }
      const key = `${data.hash}|${model?.hash ?? ''}|${optsRaw ?? ''}|${this.deps.extraKey?.(input) ?? ''}`

      let entry = this.entries.get(host)
      if (!entry && this.deps.shouldMount && !this.deps.shouldMount(host)) {
        this.deferred.add(host)
        continue
      }
      this.deferred.delete(host)

      if (!entry) {
        const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' })
        const style = this.doc.createElement('style')
        style.textContent = HOST_STYLE
        const slot = this.doc.createElement('slot')
        const container = this.doc.createElement('div')
        container.className = 'likec4-root'
        shadow.append(style, container, slot)
        entry = { root: this.deps.createRoot(container), shadow, key: null }
        this.entries.set(host, entry)
      }

      if (!force && entry.key === key) {
        continue
      }
      entry.key = key
      this.renders++
      entry.root.render(this.deps.view(input))
    }

    for (const host of this.deferred) {
      if (!host.isConnected) {
        this.deferred.delete(host)
      }
    }
    for (const [host, entry] of this.entries) {
      if (!host.isConnected) {
        entry.root.unmount()
        this.entries.delete(host)
      }
    }
  }
}
