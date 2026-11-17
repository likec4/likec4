import type MarkdownIt from 'markdown-it'
import { type FenceOptions, isLikeC4Fence, NAME_RE, parseFenceOptions, parseViewId } from './fence.ts'
import { escapeHtml, escapeJsonForScript, jsonForScript } from './html.ts'
import { type ResolvedProject, documentDirOf, documentUriOf } from './resolveProject.ts'
import { sha1Hex } from './sha1.ts'
import type { HostData, HostOptions, ProjectSnapshot, RenderDeps } from './types.ts'

type FenceRule = NonNullable<MarkdownIt['renderer']['rules']['fence']>
type Token = Parameters<FenceRule>[0][number]

interface PlannedProject {
  project: ResolvedProject
  views: Set<string>
  anyBrowser: boolean
}

interface DocState {
  counts: Map<string, number>
  emittedModels: Set<string>
  plan: Map<string, PlannedProject>
  errSeq: number
  loadSeq: number
  t0: number
  blocks: number
  firstIdx: number
  lastIdx: number
}

const docStates = new WeakMap<ReadonlyArray<Token>, DocState>()
const textEncoder = new TextEncoder()

export function projectKey(project: Pick<ResolvedProject, 'id'>): string {
  return project.id
}

export function projectTag(project: Pick<ResolvedProject, 'name' | 'folderUri'>): string {
  const hash = sha1Hex(project.folderUri).slice(0, 6)
  const safeName = project.name.replace(/[^a-zA-Z0-9_-]/g, '-') || 'project'
  return `${safeName}-${hash}`
}

export function modelElementId(project: Pick<ResolvedProject, 'name' | 'folderUri'>): string {
  return `likec4-model-${projectTag(project)}`
}

type FenceResolution =
  | { kind: 'error'; message: string; opts: FenceOptions; viewId: string }
  | { kind: 'loading'; opts: FenceOptions; viewId: string }
  | { kind: 'ok'; opts: FenceOptions; viewId: string; project: ResolvedProject }

function resolveFence(token: Token, env: unknown, deps: RenderDeps): FenceResolution {
  const opts = parseFenceOptions(token.info, deps.colorScheme())
  const parsed = parseViewId(token.content)
  if (!parsed.ok) {
    return { kind: 'error', message: parsed.message, opts, viewId: '' }
  }
  const viewId = parsed.viewId
  if (!NAME_RE.test(viewId)) {
    return { kind: 'error', message: `Invalid view id "${viewId}".`, opts, viewId }
  }
  if (opts.project !== undefined && !NAME_RE.test(opts.project)) {
    return { kind: 'error', message: `Invalid project name "${opts.project}".`, opts, viewId }
  }
  const docDir = documentDirOf(currentDocumentOf(env))
  const res = deps.resolve(docDir, opts.project)
  if (res === 'pending') {
    return { kind: 'loading', opts, viewId }
  }
  if (!res.ok) {
    return { kind: 'error', message: res.message, opts, viewId }
  }
  return { kind: 'ok', opts, viewId, project: res.project }
}

function currentDocumentOf(env: unknown): unknown {
  if (env && typeof env === 'object' && 'currentDocument' in env) {
    return (env as { currentDocument?: unknown }).currentDocument
  }
  return undefined
}

function planDocument(tokens: ReadonlyArray<Token>, env: unknown, deps: RenderDeps): Map<string, PlannedProject> {
  const plan = new Map<string, PlannedProject>()
  for (const token of tokens) {
    if (token.type !== 'fence' || !isLikeC4Fence(token.info, token.markup)) {
      continue
    }
    const resolved = resolveFence(token, env, deps)
    if (resolved.kind !== 'ok') {
      continue
    }
    const key = projectKey(resolved.project)
    let entry = plan.get(key)
    if (!entry) {
      entry = { project: resolved.project, views: new Set(), anyBrowser: false }
      plan.set(key, entry)
    }
    entry.views.add(resolved.viewId)
    entry.anyBrowser ||= resolved.opts.browser
  }
  return plan
}

function modelPayload(
  snap: ProjectSnapshot,
  planned: PlannedProject,
  maxBytes: number,
): { json: string; trimmed: boolean } {
  const full = snap.modelJson!
  const bytes = snap.modelBytes ?? textEncoder.encode(full).byteLength
  if (planned.anyBrowser && bytes <= maxBytes) {
    return { json: full, trimmed: false }
  }
  const views: Record<string, unknown> = {}
  const allViews = snap.data!.views as Record<string, unknown>
  for (const id of planned.views) {
    if (allViews[id]) {
      views[id] = allViews[id]
    }
  }
  return {
    json: jsonForScript({ ...snap.data, views }),
    trimmed: bytes > maxBytes,
  }
}

function hostHtml(id: string, opts: HostOptions | null, data: HostData, body = ''): string {
  const attr = opts ? ` data-likec4-opts="${escapeHtml(JSON.stringify(opts))}"` : ''
  return `<div class="likec4-view" id="${escapeHtml(id)}"${attr}><script type="application/json">${
    jsonForScript(data)
  }</script>${body}</div>\n`
}

function renderFence(tokens: ReadonlyArray<Token>, idx: number, env: unknown, deps: RenderDeps): string {
  let st = docStates.get(tokens)
  if (!st) {
    let firstIdx = -1
    let lastIdx = -1
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]!
      if (token.type === 'fence' && isLikeC4Fence(token.info, token.markup)) {
        if (firstIdx === -1) {
          firstIdx = i
        }
        lastIdx = i
      }
    }
    st = {
      counts: new Map(),
      emittedModels: new Set(),
      plan: planDocument(tokens, env, deps),
      errSeq: 0,
      loadSeq: 0,
      t0: performance.now(),
      blocks: 0,
      firstIdx,
      lastIdx,
    }
    docStates.set(tokens, st)
  }

  const docKey = documentUriOf(currentDocumentOf(env))
  if (idx === st.firstIdx && docKey) {
    deps.recordReferences(docKey, [...st.plan.values()].map((p) => p.project))
  }

  const resolved = resolveFence(tokens[idx]!, env, deps)
  if (resolved.kind === 'error') {
    const id = `likec4-error-${++st.errSeq}`
    return hostHtml(id, null, { hash: `error:${resolved.message}`, state: 'error', message: resolved.message })
  }
  if (resolved.kind === 'loading') {
    if (docKey) {
      deps.markPendingDiscovery?.(docKey)
    }
    const id = `likec4-loading-${++st.loadSeq}`
    return hostHtml(id, null, { hash: 'loading', state: 'loading' })
  }

  const { project, viewId, opts } = resolved
  const tag = projectTag(project)
  const countKey = `${tag}-${viewId}`
  const n = (st.counts.get(countKey) ?? 0) + 1
  st.counts.set(countKey, n)
  const hostId = `likec4-${tag}-${viewId}-${n}`

  const snap = deps.snapshot(project)
  const hostOpts: HostOptions = {
    project: project.name,
    viewId,
    model: modelElementId(project),
    browser: opts.browser,
    variant: opts.variant,
    scheme: opts.scheme,
    maxHeight: deps.maxHeight(),
    panZoom: deps.panZoom(),
  }

  if (!snap) {
    return hostHtml(hostId, hostOpts, { hash: 'loading', state: 'loading' })
  }
  if (snap.state === 'error' || !snap.data) {
    const message = snap.message ?? 'Failed to load the LikeC4 model.'
    return hostHtml(hostId, hostOpts, { hash: `error:${snap.hash}:${message}`, state: 'error', message })
  }
  if (!snap.viewIds.has(viewId)) {
    const message = `View "${viewId}" not found in LikeC4 project "${project.name}".`
    return hostHtml(hostId, hostOpts, { hash: `error:${snap.hash}:${viewId}`, state: 'error', message })
  }

  let out = ''
  const key = projectKey(project)
  const planned = st.plan.get(key) ?? { project, views: new Set([viewId]), anyBrowser: opts.browser }
  const payload = modelPayload(snap, planned, deps.maxModelBytes())
  const modelHash = `${snap.hash}${payload.trimmed ? ':t' : planned.anyBrowser ? '' : ':v'}`
  if (!st.emittedModels.has(key)) {
    st.emittedModels.add(key)
    const head = escapeJsonForScript(`{"hash":${JSON.stringify(modelHash)},"trimmed":${payload.trimmed},"model":`)
    out += `<div class="likec4-model" id="${
      escapeHtml(modelElementId(project))
    }" hidden><script type="application/json">${head}${payload.json}}</script></div>\n`
  }

  const data: HostData = {
    hash: `${modelHash}:${snap.state}`,
    state: snap.state === 'stale' ? 'stale' : 'ok',
    ...(snap.state === 'stale' && snap.message ? { message: snap.message } : {}),
    ...(payload.trimmed ? { trimmed: true } : {}),
  }

  const body = deps.renderHostBody?.(snap, viewId, hostOpts, hostId, data) ?? ''
  return out + hostHtml(hostId, hostOpts, data, body)
}

export function renderLikeC4Fence(
  tokens: ReadonlyArray<Token>,
  idx: number,
  env: unknown,
  deps: RenderDeps,
): string {
  const html = renderFence(tokens, idx, env, deps)
  const st = docStates.get(tokens)!
  st.blocks++
  if (idx === st.lastIdx) {
    deps.onRendered?.(documentUriOf(currentDocumentOf(env)), st.blocks, performance.now() - st.t0)
  }
  return html
}

/**
 * Installs the LikeC4 markdown-it fence rule while preserving any prior fence handlers (such as Mermaid).
 */
export function likec4MarkdownIt(md: MarkdownIt, deps: RenderDeps): MarkdownIt {
  const original = md.renderer.rules.fence
  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx]!
    if (deps.enabled() && isLikeC4Fence(token.info, token.markup)) {
      return renderLikeC4Fence(tokens, idx, env, deps)
    }
    return original ? original(tokens, idx, options, env, self) : self.renderToken(tokens, idx, options)
  }
  return md
}
