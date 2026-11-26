/**
 * Viewport helpers and static-snapshot initial fit positioning.
 * Keeps pre-hydration `<svg class="likec4-static">` snapshots pixel-aligned
 * with `@likec4/diagram`'s initial fit transform.
 */

export interface SavedViewport {
  readonly x: number
  readonly y: number
  readonly zoom: number
  readonly w: number
  readonly h: number
}

export interface BoundsRect {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

const PREFIX = 'likec4vp|'

function getStorage(): Storage | null {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

export function viewportKey(docKey: string, hostId: string): string {
  return `${PREFIX}${docKey}|${hostId}`
}

export function loadViewport(docKey: string, hostId: string): SavedViewport | null {
  try {
    const raw = getStorage()?.getItem(viewportKey(docKey, hostId))
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw) as Partial<SavedViewport>
    if (
      typeof parsed.x === 'number'
      && typeof parsed.y === 'number'
      && typeof parsed.zoom === 'number'
      && typeof parsed.w === 'number'
      && typeof parsed.h === 'number'
      && [parsed.x, parsed.y, parsed.zoom, parsed.w, parsed.h].every(Number.isFinite)
      && parsed.zoom > 0
    ) {
      return parsed as SavedViewport
    }
    return null
  } catch {
    return null
  }
}

export function saveViewport(docKey: string, hostId: string, viewport: SavedViewport): void {
  try {
    getStorage()?.setItem(viewportKey(docKey, hostId), JSON.stringify(viewport))
  } catch {
    // Ignore storage quota or disabled sessionStorage
  }
}

export function clearOtherDocuments(docKey: string): void {
  const s = getStorage()
  if (!s) {
    return
  }
  try {
    const prefixForDoc = `${PREFIX}${docKey}|`
    for (let i = s.length - 1; i >= 0; i--) {
      const k = s.key(i)
      if (k?.startsWith(PREFIX) && !k.startsWith(prefixForDoc)) {
        s.removeItem(k)
      }
    }
  } catch {
    // Ignore storage errors
  }
}

export function isViewportUsable(viewport: SavedViewport, bounds: BoundsRect): boolean {
  const left = -viewport.x / viewport.zoom
  const top = -viewport.y / viewport.zoom
  const right = left + viewport.w / viewport.zoom
  const bottom = top + viewport.h / viewport.zoom
  return right > bounds.x && left < bounds.x + bounds.width && bottom > bounds.y && top < bounds.y + bounds.height
}

export function makeViewportSaver(
  host: Element,
  docKey: string,
  hostId: string,
  getViewport: () => { x: number; y: number; zoom: number },
): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined

  const save = () => {
    timer = undefined
    const frame = host.shadowRoot?.querySelector('[data-likec4-frame]') ?? host
    const rect = frame.getBoundingClientRect()
    const v = getViewport()
    saveViewport(docKey, hostId, { x: v.x, y: v.y, zoom: v.zoom, w: rect.width, h: rect.height })
  }

  const schedule = () => {
    clearTimeout(timer)
    timer = setTimeout(save, 250)
  }

  const events = ['wheel', 'pointerup', 'pointermove', 'keyup', 'dblclick', 'touchend', 'click'] as const
  for (const event of events) {
    host.addEventListener(event, schedule, { passive: true, capture: true })
  }
  return () => {
    clearTimeout(timer)
    for (const event of events) {
      host.removeEventListener(event, schedule, { capture: true })
    }
  }
}

export function documentKey(): string {
  try {
    const raw = document.getElementById('vscode-markdown-preview-data')?.getAttribute('data-settings')
    const parsed = raw ? (JSON.parse(raw) as { source?: unknown }) : undefined
    return typeof parsed?.source === 'string' ? parsed.source : location.pathname
  } catch {
    return location.pathname
  }
}

export function snapshotBounds(svg: Element): BoundsRect | null {
  const parts = (svg.getAttribute('data-bounds') ?? '').split(' ').map(Number)
  if (parts.length !== 4 || !parts.every(Number.isFinite)) {
    return null
  }
  const width = parts[2]!
  const height = parts[3]!
  if (width <= 0 || height <= 0) {
    return null
  }
  return { x: parts[0]!, y: parts[1]!, width, height }
}

/**
 * Computes React Flow's initial fit viewport (`xyflow getViewportForBounds` formula,
 * 16px padding, zoom clamped to `[0.05, 1]`).
 */
export function fitViewport(bounds: BoundsRect, width: number, height: number): { x: number; y: number; zoom: number } {
  const pad = 16
  const zoom = Math.min(
    Math.max(Math.min((width - 2 * pad) / bounds.width, (height - 2 * pad) / bounds.height), 0.05),
    1,
  )
  return {
    x: Math.round(width / 2 - (bounds.x + bounds.width / 2) * zoom),
    y: Math.round(height / 2 - (bounds.y + bounds.height / 2) * zoom),
    zoom,
  }
}

function panZoomOf(host: Element): boolean {
  try {
    const raw = host.getAttribute('data-likec4-opts')
    return raw ? (JSON.parse(raw) as { panZoom?: unknown }).panZoom === true : false
  } catch {
    return false
  }
}

export function positionSnapshots(docKey: string): void {
  for (const host of document.querySelectorAll('.likec4-view')) {
    const svg = host.querySelector(':scope > svg.likec4-static')
    if (!svg || host.shadowRoot) {
      continue
    }
    const bounds = snapshotBounds(svg)
    const rect = svg.getBoundingClientRect()
    if (!bounds || !(rect.width > 0 && rect.height > 0)) {
      continue
    }
    const saved = panZoomOf(host) ? loadViewport(docKey, host.id) : null
    const viewport = saved && isViewportUsable({ ...saved, w: rect.width, h: rect.height }, bounds)
      ? saved
      : fitViewport(bounds, rect.width, rect.height)
    svg.setAttribute(
      'viewBox',
      `${-viewport.x / viewport.zoom} ${-viewport.y / viewport.zoom} ${rect.width / viewport.zoom} ${
        rect.height / viewport.zoom
      }`,
    )
  }
}

export interface FrameTraceSample {
  readonly t: number
  readonly hosts: ReadonlyArray<{
    readonly id: string
    readonly shows: 'snapshot' | 'interactive' | 'nothing'
  }>
}

export interface LikeC4PreviewDebug {
  started?: boolean
  marks: Record<string, number>
  trace?: FrameTraceSample[]
}

export function previewDiagnostics(): LikeC4PreviewDebug {
  const win = window as unknown as { __likec4?: LikeC4PreviewDebug }
  win.__likec4 ??= { marks: {} }
  return win.__likec4
}

export function startFrameTrace(): void {
  let enabled = false
  try {
    enabled = window.sessionStorage.getItem('likec4-trace') === '1'
  } catch {
    enabled = false
  }
  if (!enabled) {
    return
  }
  const trace: FrameTraceSample[] = []
  previewDiagnostics().trace = trace
  const t0 = performance.now()

  const tick = () => {
    const hosts: Array<{ id: string; shows: 'snapshot' | 'interactive' | 'nothing' }> = []
    for (const host of document.querySelectorAll('.likec4-view')) {
      const rect = host.getBoundingClientRect()
      if (rect.bottom <= 0 || rect.top >= window.innerHeight) {
        continue
      }
      const ready = Boolean(host.shadowRoot?.querySelector('.likec4-root[data-ready]'))
      const svg = ready ? null : host.querySelector(':scope > svg.likec4-static')
      const innerShadow = [...(host.shadowRoot?.querySelectorAll('*') ?? [])].find((el) => el.shadowRoot)?.shadowRoot
      const visibleNodes = [...(innerShadow?.querySelectorAll('.react-flow__node') ?? [])].filter(
        (n) => (n as HTMLElement).style.visibility !== 'hidden',
      ).length
      const hasNotice = Boolean(host.shadowRoot?.querySelector('[data-likec4-notice]'))
      let shows: 'snapshot' | 'interactive' | 'nothing' = 'nothing'
      if (!ready) {
        shows = svg ? 'snapshot' : 'nothing'
      } else if (visibleNodes > 0 || hasNotice) {
        shows = 'interactive'
      }
      hosts.push({ id: host.id, shows })
    }
    trace.push({ t: Math.round(performance.now() - t0), hosts })
    if (performance.now() - t0 < 4000) {
      requestAnimationFrame(tick)
    }
  }
  tick()
}
