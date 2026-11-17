import type { ProjectId } from '@likec4/core/types'
import type { FetchProjects } from '@likec4/language-server/protocol'
import { posix } from 'pathe'
import { URI } from 'vscode-uri'

export interface UriLocation {
  readonly scheme: string
  readonly authority: string
  /** Normalized POSIX path without trailing slash (except `'/'`). Windows drive letters are lowercased. */
  readonly path: string
}

export interface ResolvedProject {
  readonly id: ProjectId
  readonly name: string
  readonly title?: string | undefined
  readonly folderUri: string
  readonly scheme: string
  readonly authority: string
  readonly folderPath: string
  readonly docs: ReadonlyArray<string>
}

export type ProjectResolution =
  | { ok: true; project: ResolvedProject }
  | { ok: false; message: string }

function normalizePath(rawPath: string): string {
  const withLowerDrive = rawPath.replace(/^\/([A-Z]):/, (_, drive: string) => `/${drive.toLowerCase()}:`)
  const normalized = posix.normalize(withLowerDrive || '/')
  if (normalized.length > 1 && normalized.endsWith('/')) {
    return normalized.slice(0, -1)
  }
  return normalized
}

export function normalizeUri(raw: string | URI): UriLocation {
  const uri = typeof raw === 'string'
    ? (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw) ? URI.parse(raw) : URI.file(raw))
    : raw
  return {
    scheme: uri.scheme.toLowerCase(),
    authority: uri.authority.toLowerCase(),
    path: normalizePath(uri.path),
  }
}

/**
 * Extracts a URI string for a document value passed via markdown-it `env.currentDocument`.
 */
export function documentUriOf(doc: unknown): string | undefined {
  if (typeof doc === 'string') {
    return /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(doc) ? URI.parse(doc).toString() : URI.file(doc).toString()
  }
  if (!doc || typeof doc !== 'object') {
    return undefined
  }
  const candidate = doc as { scheme?: unknown; path?: unknown; fsPath?: unknown; toString?: unknown }
  if (typeof candidate.scheme === 'string' && typeof candidate.path === 'string') {
    const authority = 'authority' in candidate && typeof candidate.authority === 'string' ? candidate.authority : ''
    return URI.from({ scheme: candidate.scheme, authority, path: candidate.path }).toString()
  }
  if (typeof candidate.fsPath === 'string' && candidate.fsPath.length > 0) {
    return URI.file(candidate.fsPath).toString()
  }
  return undefined
}

/**
 * Extracts the parent directory location of a markdown document from `env.currentDocument`.
 */
export function documentDirOf(doc: unknown): UriLocation | undefined {
  const uriStr = documentUriOf(doc)
  if (!uriStr) {
    return undefined
  }
  const loc = normalizeUri(uriStr)
  return {
    scheme: loc.scheme,
    authority: loc.authority,
    path: normalizePath(posix.dirname(loc.path)),
  }
}

/**
 * Returns true when `dir` equals `folder` or lies inside it within the same URI scheme/authority.
 */
export function isWithinLocation(dir: UriLocation, folder: UriLocation): boolean {
  if (dir.scheme !== folder.scheme || dir.authority !== folder.authority) {
    return false
  }
  if (dir.path === folder.path) {
    return true
  }
  const prefix = folder.path === '/' ? '/' : `${folder.path}/`
  return dir.path.startsWith(prefix)
}

/**
 * Converts the `FetchProjects` LSP response map into normalized, deterministically sorted `ResolvedProject` records.
 */
export function fromRpcProjects(projects: FetchProjects.Res['projects']): ResolvedProject[] {
  return Object.entries(projects)
    .map(([rawId, info]) => {
      const id = rawId as ProjectId
      const loc = normalizeUri(info.folder)
      const name = info.config.name || rawId
      return {
        id,
        name,
        title: info.config.title,
        folderUri: URI.from({ scheme: loc.scheme, authority: loc.authority, path: loc.path }).toString(),
        scheme: loc.scheme,
        authority: loc.authority,
        folderPath: loc.path,
        docs: info.docs.map((d) => String(d)),
      } satisfies ResolvedProject
    })
    .sort((a, b) => {
      const aDefault = a.id === 'default' ? 1 : 0
      const bDefault = b.id === 'default' ? 1 : 0
      if (aDefault !== bDefault) {
        return aDefault - bDefault
      }
      if (a.folderPath.length !== b.folderPath.length) {
        return b.folderPath.length - a.folderPath.length
      }
      return a.id.localeCompare(b.id)
    })
}

function findNearestProject(
  dir: UriLocation,
  candidates: ReadonlyArray<ResolvedProject>,
  includeDefault: boolean,
): ResolvedProject | undefined {
  let best: ResolvedProject | undefined
  for (const project of candidates) {
    if (!includeDefault && project.id === 'default') {
      continue
    }
    const loc: UriLocation = {
      scheme: project.scheme,
      authority: project.authority,
      path: project.folderPath,
    }
    if (isWithinLocation(dir, loc) && (!best || project.folderPath.length > best.folderPath.length)) {
      best = project
    }
  }
  return best
}

/**
 * Resolves which LikeC4 project a `likec4-view` block belongs to:
 * 1. Explicit `project=<name>` (matches `name` or `id`; nearest ancestor breaks ties).
 * 2. Nearest explicit project folder containing the Markdown document.
 * 3. `'default'` project containing the Markdown document.
 * 4. Single-project workspace fallback (supports root READMEs and `untitled:` docs).
 */
export function resolveProject(
  docDir: UriLocation | undefined,
  explicit: string | undefined,
  projects: ReadonlyArray<ResolvedProject>,
): ProjectResolution {
  if (explicit) {
    const matches = projects.filter((p) => p.name === explicit || p.id === explicit)
    if (matches.length === 0) {
      return { ok: false, message: `LikeC4 project "${explicit}" not found.` }
    }
    const near = docDir ? findNearestProject(docDir, matches, true) : undefined
    return { ok: true, project: near ?? matches[0]! }
  }

  if (docDir) {
    const nearExplicit = findNearestProject(docDir, projects, false)
    if (nearExplicit) {
      return { ok: true, project: nearExplicit }
    }
    const nearDefault = findNearestProject(docDir, projects, true)
    if (nearDefault) {
      return { ok: true, project: nearDefault }
    }
  }

  if (projects.length === 1) {
    return { ok: true, project: projects[0]! }
  }

  if (projects.length > 1) {
    return {
      ok: false,
      message: 'Multiple LikeC4 projects exist; specify project=<name> on this likec4-view block.',
    }
  }

  return { ok: false, message: 'No LikeC4 project found for this Markdown file.' }
}
