import type { LayoutedLikeC4ModelData } from '@likec4/core'
import type { ProjectId } from '@likec4/core/types'
import type { LikeC4 as LikeC4Instance } from '@likec4/language-services/node'
import { fromWorkspace } from '@likec4/language-services/node'
import { loggable } from '@likec4/log'
import ky, { HTTPError } from 'ky'
import { realpathSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { gzipSync } from 'node:zlib'
import { env } from 'std-env'
import k from 'tinyrainbow'
import { createLikeC4Logger, startTimer } from '../../logger'
import type { LikeC4Model } from '../../model'
import { ensureProject } from '../utils'
import { collectAssets } from './assets'
import { createGitRunner, readGitProvenance } from './git'
import { buildPublishPayload } from './payload'

const ENV_TOKEN = 'LIKEC4_PUBLISH_TOKEN'
const ENV_CLOUD_URL = 'LIKEC4_CLOUD_URL'
const DEFAULT_CLOUD_URL = 'https://likec4.app'
const PUBLISH_ENDPOINT = '/api/publish'

/**
 * Id of the synthetic project the language server always appends to
 * `projectsManager.all` (`ProjectsManager.DefaultProjectId`).
 *
 * It is not re-exported from `@likec4/language-server`, so it is mirrored here. The value is
 * safe to pin: `likec4.config.json` validation rejects `"default"` as a project name, so a
 * real project can never claim this id. If it ever drifted, the failure would be loud (a
 * duplicate `workspacePath`), not silent — see {@link selectProjects}.
 */
const SYNTHETIC_DEFAULT_PROJECT_ID = 'default'

/**
 * ky defaults to a 10s timeout, which is far too short for a multi-MB upload.
 */
const REQUEST_TIMEOUT_MS = 120_000

export type PublishHandlerParams = {
  /** Directory with LikeC4 sources */
  path: string
  /** Publish token, falls back to `LIKEC4_PUBLISH_TOKEN` */
  token: string | undefined
  /** Cloud base url, falls back to `LIKEC4_CLOUD_URL`, then to `https://likec4.app` */
  url: string | undefined
  /** Publish a single project by name or path */
  project: string | undefined
  /** Override "owner/repo" */
  origin: string | undefined
  /** Override commit sha */
  sha: string | undefined
  /** Override branch */
  branch: string | undefined
  /** Override tag */
  tag: string | undefined
  /** Publish even if the model has validation errors */
  force: boolean
  /** Use graphviz binary instead of wasm */
  useDotBin: boolean
}

type PublishResponse = {
  success: true
  snapshotId: string
  url: string
}

/**
 * Resolves the publish token from the flag, then the environment. Throws if absent.
 *
 * The token is put into a request header and is never logged. This holds only because the
 * CLI reports errors through `loggable()`, which prints `message + stack` and nothing else -
 * `util.inspect` (or any other structured dump) of a ky `HTTPError` would print
 * `error.request.headers` and leak `X-Publish-Token`. Keep it that way.
 */
function resolveToken(flag: string | undefined): string {
  const token = flag?.trim() || env[ENV_TOKEN]?.trim()
  if (!token) {
    throw new Error(
      `No publish token provided, pass --token or set the ${ENV_TOKEN} environment variable`,
    )
  }
  return token
}

/** Resolves the cloud base url from the flag, then the environment, then the default. */
function resolveBaseUrl(flag: string | undefined): string {
  const url = flag?.trim() || env[ENV_CLOUD_URL]?.trim() || DEFAULT_CLOUD_URL
  return url.replace(/\/+$/, '')
}

function humanSize(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`
}

/**
 * Resolves symlinks so paths from different sources can be compared.
 *
 * `git rev-parse --show-toplevel` always reports the *physical* path, while the workspace
 * path and the project folders keep whatever the user typed. On macOS (`/tmp` →
 * `/private/tmp`), symlinked home directories and some CI runners the two differ, and the
 * relative path between them would wrongly come out as `../…`.
 *
 * A path that does not exist is resolved through its closest existing ancestor, so the git
 * root and the project folders stay consistent with each other even then. Falls back to the
 * plain resolved path if nothing can be resolved at all.
 */
function toPhysicalPath(path: string): string {
  const absolute = resolve(path)
  let current = absolute
  const trailing: string[] = []
  for (;;) {
    try {
      return join(realpathSync(current), ...trailing.reverse())
    } catch {
      const parent = dirname(current)
      if (parent === current) {
        return absolute
      }
      trailing.push(basename(current))
      current = parent
    }
  }
}

/**
 * A project is "empty" when none of its views renders a single node - there is then nothing
 * to show in the cloud viewer, so it is skipped instead of being published as an empty row.
 *
 * The test is deliberately on **rendered node count**, not on element presence:
 *
 * - it cannot be an identity check against `LikeC4Model.EMPTY`, because `layoutedModel()`
 *   always returns a freshly created instance - the identity is never equal;
 * - it cannot be `isEmpty(elements)`, because a project may own no elements at all and still
 *   render real diagrams, either by `import`ing another project's elements or by pulling
 *   sources in through `include.paths` in its config;
 * - it cannot be the mere *presence* of views either, because LikeC4 auto-generates an
 *   `index` view for every project, including a completely empty one.
 *
 * Node count is the one signal that survives all three: the auto-generated view of a truly
 * empty project has zero nodes.
 */
function isEmptyModel(model: LikeC4Model.Layouted): boolean {
  return Object.values(model.$data.views).every(view => view.nodes.length === 0)
}

/**
 * Paths in payload errors are the *resolved* ones, which the user never typed. When a symlink
 * was followed to get there, append the mapping so the message is actionable.
 */
function explainResolvedSymlinks(err: unknown, resolved: ReadonlyMap<string, string>): unknown {
  if (resolved.size === 0 || !(err instanceof Error)) {
    return err
  }
  const mappings = [...resolved].map(([physical, original]) => `  "${original}" -> "${physical}"`)
  return new Error(
    `${err.message}\nSymlinked paths were resolved to their real location before comparing:\n`
      + mappings.join('\n'),
    { cause: err },
  )
}

/**
 * Every project of the workspace that should be published, with its folder.
 *
 * `projectsManager.all` is the authoritative list of registered projects, but it always
 * appends a synthetic `default` entry pointing at the workspace root. That entry has to be
 * dropped when real projects exist, otherwise it collides with a root project on the `"."`
 * payload key, or contributes an empty model.
 *
 * It must **not** be dropped unconditionally:
 * - a workspace with no `likec4.config.json` at all has `all === ['default']`, and there the
 *   default entry *is* the real project;
 * - `default` also owns any stray sources that sit outside every configured project.
 *
 * `languageServices.projects()` cannot be the base list either. It is grouped by document
 * *ownership*, so a project that pulls all of its sources in through `include.paths` and owns
 * no `.c4` file of its own never appears in it - even though it renders real diagrams. It is
 * only consulted here to decide whether the synthetic `default` entry carries any content.
 */
function selectProjects(
  likec4: LikeC4Instance,
  logger: { debug: (msg: string) => void },
): Array<{ id: ProjectId; folder: string }> {
  const all = [...new Set(likec4.projectsManager.all)]
  const ownsDocuments = new Set<string>(likec4.languageServices.projects().map(p => p.id))
  const selected = all.filter(id =>
    id !== SYNTHETIC_DEFAULT_PROJECT_ID
    || ownsDocuments.has(id)
    || all.length === 1
  )
  const dropped = all.filter(id => !selected.includes(id))
  if (dropped.length > 0) {
    logger.debug(`skipping synthetic empty project(s): ${dropped.join(', ')}`)
  }
  return selected.map(id => ({
    id,
    folder: likec4.projectsManager.getProject(id).folderUri.fsPath,
  }))
}

/**
 * Publishes Graphviz-layouted models of the workspace to LikeC4 Cloud
 * as a Snapshot of the current commit.
 *
 * Re-publishing the same commit overwrites its snapshot, projects accumulate into it.
 */
export async function publishHandler(params: PublishHandlerParams): Promise<void> {
  const logger = createLikeC4Logger('c4:publish')
  const timer = startTimer(logger)

  const token = resolveToken(params.token)
  const baseUrl = resolveBaseUrl(params.url)

  // Only pass overrides that were actually given (exactOptionalPropertyTypes)
  const overrides: { origin?: string; sha?: string; branch?: string; tag?: string } = {}
  if (params.origin) overrides.origin = params.origin
  if (params.sha) overrides.sha = params.sha
  if (params.branch) overrides.branch = params.branch
  if (params.tag) overrides.tag = params.tag

  /** physical path -> the path the user actually configured, for paths that were symlinks */
  const resolvedSymlinks = new Map<string, string>()

  const workspacePath = resolve(params.path)
  const provenance = await readGitProvenance({
    runner: createGitRunner(workspacePath),
    env,
    overrides,
  })

  // `readGitProvenance` returns an empty root when git could not be queried and the
  // --origin/--sha escape hatch was used. The workspace directory is then the only
  // sensible base for the `workspacePath` keys of the payload.
  const gitRoot = toPhysicalPath(provenance.root || workspacePath)

  logger.info(`${k.dim('origin:')} ${k.green(provenance.origin)}`)
  logger.info(`${k.dim('commit:')} ${k.green(provenance.sha)}`)
  logger.info(`${k.dim('branch:')} ${provenance.branch ? k.green(provenance.branch) : k.dim('(none)')}`)
  if (provenance.tag) {
    logger.info(`${k.dim('tag:')} ${k.green(provenance.tag)}`)
  }

  // `dirty` is tri-state: true / false / null (undetermined). `null` must not be silently
  // treated as clean - it is exactly the case where the dirty warning would be suppressed.
  switch (provenance.dirty) {
    case true:
      logger.warn(
        k.yellow(
          'Working tree is DIRTY - publishing anyway. The snapshot is keyed by commit sha, '
            + 'so it will not match the sources you are publishing.',
        ),
      )
      break
    case null:
      // With no git repository at all this is implied by the "no git repository" warning
      // below, so it is not repeated here.
      if (provenance.root) {
        logger.warn(
          k.yellow(
            'Could not determine whether the working tree is clean - if it is not, the snapshot '
              + 'is keyed by a commit sha that does not match the sources you are publishing.',
          ),
        )
      }
      break
    default:
      break
  }
  if (!provenance.branch) {
    logger.warn(
      k.yellow(
        'No branch resolved - the snapshot will not be branch-addressable. Pass --branch to set it explicitly.',
      ),
    )
  }
  if (!provenance.root) {
    logger.warn(
      k.yellow(
        `No git repository detected - project paths will be relative to ${gitRoot}`,
      ),
    )
  }
  if (provenance.commit.author === '' && provenance.commit.message === '') {
    logger.warn(
      k.yellow(
        'No commit metadata available - publishing with an empty commit author, email and message.',
      ),
    )
  }

  await using likec4 = await fromWorkspace(workspacePath, {
    // Decision #8: validation errors block the publish unless --force
    throwIfInvalid: !params.force,
    printErrors: true,
    graphviz: params.useDotBin ? 'binary' : 'wasm',
    watch: false,
  })

  let selected: Array<{ id: ProjectId; folder: string }>
  if (params.project) {
    const { projectId, projectFolder } = ensureProject(likec4, params.project)
    selected = [{ id: projectId, folder: projectFolder }]
    logger.info(`${k.dim('project:')} ${k.green(projectId)}`)
  } else {
    selected = selectProjects(likec4, logger)
    logger.info(`${k.dim('workspace:')} Found ${selected.length} projects`)
  }

  const projects: Array<{ name: string; folder: string; data: LayoutedLikeC4ModelData }> = []
  for (const { id, folder } of selected) {
    try {
      logger.info(`Generating layouted model for project ${k.green(id)}`)
      const model = await likec4.layoutedModel(id)
      if (isEmptyModel(model)) {
        logger.warn(k.yellow(`Project ${id} is empty, skipping`))
        continue
      }
      const physicalFolder = toPhysicalPath(folder)
      if (physicalFolder !== folder) {
        resolvedSymlinks.set(physicalFolder, folder)
      }
      projects.push({
        name: id,
        folder: physicalFolder,
        data: model.$data,
      })
    } catch (err) {
      logger.error(loggable(err))
      logger.warn(`Skipping project ${k.red(id)}`)
    }
  }

  if (projects.length === 0) {
    throw new Error('Nothing to publish; all projects are empty or were skipped')
  }

  // Local icon files are read and inlined before the payload is built: the models handed to
  // `buildPublishPayload` are the rewritten ones, referencing `asset://<sha256>`.
  // `--force` reaches the collection here, downgrading a broken asset to a warning exactly as
  // it downgrades a validation error above.
  const collected = await collectAssets({ projects, force: params.force, logger })

  let payload
  try {
    payload = buildPublishPayload({
      provenance: { ...provenance, root: gitRoot },
      projects: collected.projects,
      assets: collected.assets,
    })
  } catch (err) {
    throw explainResolvedSymlinks(err, resolvedSymlinks)
  }
  const json = JSON.stringify(payload)
  const body = new Uint8Array(gzipSync(json))
  logger.info(
    `${k.dim('payload:')} ${humanSize(Buffer.byteLength(json))} ${k.dim('→')} ${humanSize(body.byteLength)} ${
      k.dim('gzipped')
    }`,
  )
  const assetCount = Object.keys(collected.assets).length
  if (assetCount > 0) {
    logger.info(`${k.dim('assets:')} ${assetCount} ${k.dim('file(s),')} ${humanSize(collected.totalBytes)}`)
  }

  const endpoint = `${baseUrl}${PUBLISH_ENDPOINT}`
  logger.info(`${k.dim('publishing to')} ${k.green(endpoint)}`)

  let response: PublishResponse
  try {
    response = await ky.post(endpoint, {
      body,
      headers: {
        'X-Publish-Token': token,
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip',
      },
      // Endpoint is idempotent, so retrying POST is safe (decision #11).
      // `limit: 3` means up to 3 retries, i.e. 4 requests in total. ky defaults
      // `retryOnTimeout` to false; decision #11 calls for retrying network failures, and a
      // stalled upload is exactly that, so it is enabled here. Worst case is therefore
      // 4 x 120s before the command gives up.
      retry: {
        limit: 3,
        retryOnTimeout: true,
        methods: ['post'],
        statusCodes: [429, 500, 502, 503, 504],
      },
      timeout: REQUEST_TIMEOUT_MS,
    }).json<PublishResponse>()
  } catch (err) {
    if (err instanceof HTTPError) {
      // Server error bodies are plain text, print them verbatim
      let text = ''
      try {
        text = await err.response.text()
      } catch {
        // ignore, we still report the status
      }
      logger.error(k.red(`Publish failed: HTTP ${err.response.status} ${err.response.statusText}`))
      if (text.trim().length > 0) {
        logger.error(text)
      }
      process.exitCode = 1
      return
    }
    throw err
  }

  logger.info(`${k.dim('snapshot:')} ${k.green(response.snapshotId)}`)
  logger.info(`${k.dim('view at')} ${k.underline(k.green(response.url))}`)
  timer.stopAndLog('✓ published in ')
}
