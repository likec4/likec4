/**
 * Collection of the local files a model references as icons (ADR-0010 of `likec4/cloud`).
 *
 * A model may point at an image on the publishing machine (`icon ./images/logo.svg` is resolved
 * by the language server into an absolute `file://` url), which the cloud cannot resolve. The
 * bytes are therefore read here, named by the sha256 of their content, inlined into the payload
 * as base64, and the model's references are rewritten to `asset://<sha256>`.
 */
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import k from 'tinyrainbow'
import type { PublishAsset, PublishProject } from './payload'

/**
 * The only key whose value is treated as an icon reference.
 *
 * Rewriting **by key name** rather than by type is the load-bearing decision of ADR-0010: the
 * icon-carrying fields are already spread over specification element/tag/deployment-kind styles,
 * view rule style overrides, `elements`, `deployments.elements`, `views[].nodes` and
 * `manualLayouts[].nodes`, and mirroring that list here would drift silently as `@likec4/core`
 * evolves - leaving dead `file:///home/runner/…` paths in a published model.
 *
 * Only the *immediate* string value of the key is considered, which is what keeps
 * `element.links[].url` - arbitrary user text that may legitimately be a `file://` hyperlink -
 * out of reach: it sits under `url`, not under `icon`.
 */
const ICON_KEY = 'icon'

/** Icons pointing at the publishing machine's filesystem, the ones that have to be collected. */
const FILE_PROTOCOL = 'file://'

/** Scheme of a collected, content-addressed asset; resolved by the cloud viewer. */
const ASSET_PROTOCOL = 'asset://'

/** Max size of a single asset - 1 MiB. Mirrors the server, which answers 413 above it. */
export const ASSET_MAX_BYTES = 1024 * 1024

/** Max size of all assets of one publish - 10 MiB. Mirrors the server. */
export const ASSET_MAX_TOTAL_BYTES = 10 * 1024 * 1024

/** Max number of assets of one publish. Mirrors the server. */
export const ASSET_MAX_COUNT = 200

/**
 * Every distinct `file://` value found under an {@link ICON_KEY} key, at any depth.
 *
 * The model data is plain JSON (it is `JSON.stringify`-ed into the request body), so the walk
 * needs no cycle guard.
 */
export function collectFileIcons(data: unknown): Set<string> {
  const found = new Set<string>()
  const visit = (value: unknown): void => {
    if (Array.isArray(value)) {
      for (const item of value) {
        visit(item)
      }
      return
    }
    if (value === null || typeof value !== 'object') {
      return
    }
    for (const [key, item] of Object.entries(value)) {
      if (key === ICON_KEY && typeof item === 'string') {
        if (item.startsWith(FILE_PROTOCOL)) {
          found.add(item)
        }
        continue
      }
      visit(item)
    }
  }
  visit(data)
  return found
}

/**
 * Replaces the icon references listed in `rewritten`, leaving everything else untouched.
 *
 * Copy-on-write: any object or array that did not change keeps its identity, so the layouted
 * model owned by the language services is never mutated and an untouched model is not copied.
 */
export function rewriteFileIcons<T>(data: T, rewritten: ReadonlyMap<string, string>): T {
  if (rewritten.size === 0) {
    return data
  }
  const visit = (value: unknown): unknown => {
    if (Array.isArray(value)) {
      let changed = false
      const items = value.map(item => {
        const next = visit(item)
        changed = changed || next !== item
        return next
      })
      return changed ? items : value
    }
    if (value === null || typeof value !== 'object') {
      return value
    }
    let changed = false
    const result: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value)) {
      const next = key === ICON_KEY && typeof item === 'string'
        ? rewritten.get(item) ?? item
        : visit(item)
      changed = changed || next !== item
      result[key] = next
    }
    return changed ? result : value
  }
  return visit(data) as T
}

/** The slice of the CLI logger {@link collectAssets} needs. */
export type AssetsLogger = {
  warn: (msg: string) => void
}

export type CollectAssetsParams = {
  projects: ReadonlyArray<PublishProject>
  /**
   * `--force` - a broken or oversized asset becomes a warning instead of failing the publish.
   * The reference is then left as the original `file://`, which the viewer renders as nothing
   * (so behaviour degrades to what it was before assets existed) while the bad path stays
   * visible for diagnosis.
   */
  force: boolean
  logger: AssetsLogger
}

export type CollectedAssets = {
  /** the input projects, with their `file://` icons rewritten to `asset://<sha256>` */
  projects: PublishProject[]
  /** keyed by the lowercase hex sha256 of the bytes, empty when nothing was collected */
  assets: Record<string, PublishAsset>
  /** number of decoded bytes of all collected assets */
  totalBytes: number
}

/** A file that could not be turned into an asset, named so the user can fix it. */
class AssetError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'AssetError'
  }
}

/** The filesystem path an icon reference points at. */
function toFilePath(reference: string): string {
  try {
    const url = new URL(reference)
    // A host-qualified `file://` url points at a remote share, which is not something the
    // publishing machine should be reading. POSIX rejects it already, Windows happily resolves
    // it to the UNC path `\\host\share\...`, so it is rejected here on every platform.
    if (url.protocol === 'file:' && url.hostname !== '' && url.hostname !== 'localhost') {
      throw new Error(`unsupported file url host "${url.hostname}"`)
    }
    return fileURLToPath(url)
  } catch (err) {
    throw new AssetError(
      `Icon "${reference}" is not a local file path`,
      { cause: err },
    )
  }
}

/** Reads the bytes of one asset, or throws naming the file. */
async function readAsset(reference: string): Promise<{ path: string; content: Buffer }> {
  const path = toFilePath(reference)
  let content: Buffer
  try {
    content = await readFile(path)
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code
    throw new AssetError(
      code === 'ENOENT'
        ? `Icon file "${path}" does not exist`
        : `Icon file "${path}" could not be read (${code ?? 'unknown error'})`,
      { cause: err },
    )
  }
  if (content.byteLength > ASSET_MAX_BYTES) {
    throw new AssetError(
      `Icon file "${path}" is ${content.byteLength} bytes, over the ${ASSET_MAX_BYTES} bytes per-asset limit`,
    )
  }
  return { path, content }
}

/**
 * Reads every local icon of every project, and returns the projects with their references
 * rewritten to `asset://<sha256>` alongside the bytes to inline into the payload.
 *
 * Assets are deduplicated by content across the whole publish - the same icon set is
 * republished on every commit and reused by many elements, so hashing deduplicates exactly
 * where the repetition is.
 *
 * @throws when a file is missing, unreadable, or a cap is breached - unless `force` is set,
 * which downgrades it to a warning and keeps the original `file://` reference
 */
export async function collectAssets({ projects, force, logger }: CollectAssetsParams): Promise<CollectedAssets> {
  const assets: Record<string, PublishAsset> = {}
  /** icon reference -> `asset://<sha256>`, shared by every project of this publish */
  const rewritten = new Map<string, string>()
  /** references already reported as broken, so each one is warned about once */
  const skipped = new Set<string>()
  let totalBytes = 0
  let count = 0

  const collected: PublishProject[] = []
  for (const project of projects) {
    for (const reference of collectFileIcons(project.data)) {
      if (rewritten.has(reference) || skipped.has(reference)) {
        continue
      }
      try {
        const { path, content } = await readAsset(reference)
        const hash = createHash('sha256').update(content).digest('hex')
        // Same bytes reached through another path: the caps count it once, as the payload does
        if (!Object.hasOwn(assets, hash)) {
          if (count >= ASSET_MAX_COUNT) {
            throw new AssetError(
              `Too many icon files: at most ${ASSET_MAX_COUNT} per publish, "${path}" is over the limit`,
            )
          }
          if (totalBytes + content.byteLength > ASSET_MAX_TOTAL_BYTES) {
            throw new AssetError(
              `Icon files exceed the ${ASSET_MAX_TOTAL_BYTES} bytes total limit, "${path}" is over it`,
            )
          }
          assets[hash] = {
            // basename only - the resolved path would put the CI machine's directory layout
            // into the cloud database
            filename: basename(path),
            bytes: content.toString('base64'),
          }
          totalBytes += content.byteLength
          count++
        }
        rewritten.set(reference, `${ASSET_PROTOCOL}${hash}`)
      } catch (err) {
        if (!force) {
          throw err instanceof AssetError
            ? new AssetError(
              `${err.message}\nReferenced by project "${project.name}". Pass --force to skip it and publish anyway.`,
              { cause: err.cause },
            )
            : err
        }
        skipped.add(reference)
        logger.warn(
          k.yellow(
            `${err instanceof Error ? err.message : String(err)}\n`
              + `Referenced by project "${project.name}" - skipping it, the icon will not render.`,
          ),
        )
      }
    }
    collected.push({
      ...project,
      data: rewriteFileIcons(project.data, rewritten),
    })
  }

  return { projects: collected, assets, totalBytes }
}
