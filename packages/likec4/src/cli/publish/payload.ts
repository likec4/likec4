import type { LayoutedLikeC4ModelData } from '@likec4/core'
import { relative } from 'node:path'
import type { GitCommit, GitProvenance } from './git'

/**
 * Still-absolute result of `relative()`, after separators were normalized:
 * `/srv/repo` or `C:/repo`.
 *
 * On Windows `relative()` returns the target unchanged when the two paths share no root
 * (different drives, or a UNC share vs. a drive), so such a path never starts with `..`.
 */
const ABSOLUTE_PATH = /^(?:\/|[a-zA-Z]:\/)/

/**
 * The slice of `node:path` that {@link toWorkspacePath} needs.
 *
 * Both `node:path/posix` and `node:path/win32` satisfy it, so callers can pin the path
 * semantics instead of inheriting the host platform's. Tests use it to cover Windows
 * behaviour deterministically on any platform, without mocking the module registry.
 */
export type WorkspacePathResolver = {
  relative: (from: string, to: string) => string
}

/** Default resolver — the host platform's `node:path`. */
const hostPath: WorkspacePathResolver = { relative }

/**
 * Converts an absolute project folder into the `workspacePath` key used by the endpoint:
 * a path relative to the git root, with POSIX separators, `"."` for a root project.
 *
 * @param path path semantics to use, defaults to the host platform's `node:path`
 * @throws when the project folder is outside the git root
 */
export function toWorkspacePath(
  gitRoot: string,
  projectFolder: string,
  path: WorkspacePathResolver = hostPath,
): string {
  const workspacePath = path.relative(gitRoot, projectFolder).replaceAll('\\', '/')
  if (workspacePath === '') {
    return '.'
  }
  if (workspacePath === '..' || workspacePath.startsWith('../') || ABSOLUTE_PATH.test(workspacePath)) {
    throw new Error(
      `Project folder "${projectFolder}" is outside the git root "${gitRoot}", cannot publish it`,
    )
  }
  return workspacePath
}

/** A single project to publish, as loaded from the workspace. */
export type PublishProject = {
  /** project id/name, used only in error messages */
  name: string
  /** absolute path of the project folder */
  folder: string
  data: LayoutedLikeC4ModelData
}

/**
 * A local file the model referenced as an icon, inlined into the payload.
 *
 * The server validates exactly this shape and recomputes the digest of `bytes` against the key
 * it is stored under.
 */
export type PublishAsset = {
  /**
   * Basename only — never the resolved path, which would leak the publishing machine's
   * directory layout into the cloud database.
   */
  filename: string
  /** base64 of the file's bytes */
  bytes: string
}

/** Request body of `POST /api/publish`. */
export type PublishPayload = {
  /** `owner/repo` — a safety interlock, the server compares it with the token's workspace */
  origin: string
  branch: string | null
  tag: string | null
  sha: string
  commit: GitCommit
  /** keyed by `workspacePath` (see {@link toWorkspacePath}) */
  projects: Record<string, LayoutedLikeC4ModelData>
  /**
   * Local icon files, keyed by the lowercase hex sha256 of their bytes, as referenced by
   * `asset://<sha256>` in the models.
   *
   * Absent — not empty — when nothing was collected, so a publish without local icons sends
   * exactly the body it sent before assets existed.
   */
  assets?: Record<string, PublishAsset>
}

export type BuildPublishPayloadParams = {
  provenance: GitProvenance
  projects: ReadonlyArray<PublishProject>
  /** see {@link PublishPayload.assets}; an empty record is omitted from the payload */
  assets?: Record<string, PublishAsset> | undefined
}

/**
 * Builds the `POST /api/publish` request body.
 *
 * @throws when two projects resolve to the same `workspacePath` (one would silently
 * overwrite the other, as `projects` is a `Record`), or when a project folder is
 * outside the git root
 */
export function buildPublishPayload({ provenance, projects, assets }: BuildPublishPayloadParams): PublishPayload {
  const data: Record<string, LayoutedLikeC4ModelData> = {}
  const claimedBy = new Map<string, string>()

  for (const project of projects) {
    const workspacePath = toWorkspacePath(provenance.root, project.folder)
    const claimed = claimedBy.get(workspacePath)
    if (claimed !== undefined) {
      throw new Error(
        `Projects "${claimed}" and "${project.name}" resolve to the same workspace path "${workspacePath}"`,
      )
    }
    claimedBy.set(workspacePath, project.name)
    data[workspacePath] = project.data
  }

  const payload: PublishPayload = {
    origin: provenance.origin,
    branch: provenance.branch,
    tag: provenance.tag,
    sha: provenance.sha,
    commit: provenance.commit,
    projects: data,
  }
  // A project with no local icons must produce no `assets` key at all - an empty object would
  // be a payload shape the previous CLI never sent, for no gain.
  if (assets && Object.keys(assets).length > 0) {
    payload.assets = assets
  }
  return payload
}
