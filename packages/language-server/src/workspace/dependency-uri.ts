import { invariant } from '@likec4/core/utils'
import { URI } from 'langium'

/**
 * URI scheme of documents of external projects (dependencies outside the workspace).
 * Documents are loaded in memory and are read-only.
 */
export const DEPENDENCY_URI_SCHEME = 'likec4-dep'

/**
 * Authority of URIs of local dependencies (loaded from a folder on the file system)
 */
export const LOCAL_DEPENDENCY_AUTHORITY = 'local'

/**
 * Path segment that separates the instance path from the path of the file inside the instance.
 * Segments of the instance path that consist only of `-` are escaped with one more `-`
 * (`-` → `--`, `--` → `---`), so the first `-` segment is always the separator.
 */
const SEPARATOR = '-'

const onlyDashes = /^-+$/

function escapeInstanceSegment(segment: string): string {
  return onlyDashes.test(segment) ? `${segment}-` : segment
}

function unescapeInstanceSegment(segment: string): string {
  return onlyDashes.test(segment) ? segment.slice(1) : segment
}

/**
 * Parsed URI of a document of an external project:
 *
 * ```
 * likec4-dep://<authority>/<instance>/-/<path>
 * ```
 *
 * - local dependency: `likec4-dep://local/<folder path>/-/<path>`,
 *   e.g. `likec4-dep://local/work/shared/-/model.c4`
 *   or `likec4-dep://local/c%3A/work/shared/-/views/index.c4` (Windows, folder `C:\work\shared`)
 * - git dependency: `likec4-dep://<host>[:<port>]/<repo>@<sha>[/<subdir>]/-/<path>`,
 *   e.g. `likec4-dep://github.com/my-org/billing@<sha>/-/architecture/model.c4`,
 *   see {@link gitDependencyUri}
 *
 * The instance is recoverable from the URI alone, and nested instances
 * (`/deps/lib` and `/deps/lib/sub`) get distinct URIs for the same file.
 */
export interface DependencyUri {
  /**
   * `local` for local dependencies
   */
  readonly authority: string
  /**
   * Path of the instance, starts with `/`, without trailing slash (decoded)
   */
  readonly instance: string
  /**
   * Path of the file inside the instance, without leading slash (decoded)
   */
  readonly path: string
}

/**
 * Checks if the URI (or URI string) has the {@link DEPENDENCY_URI_SCHEME} scheme.
 */
export function isDependencyUri(uri: URI | string): boolean {
  if (typeof uri === 'string') {
    return uri.startsWith(`${DEPENDENCY_URI_SCHEME}:`)
  }
  return uri.scheme === DEPENDENCY_URI_SCHEME
}

/**
 * Builds a URI of a document of an external project.
 */
export function buildDependencyUri({ authority, instance, path }: DependencyUri): URI {
  invariant(authority.length > 0, 'Dependency URI authority cannot be empty')
  const instanceSegments = instance.split('/').filter(s => s.length > 0).map(escapeInstanceSegment)
  invariant(instanceSegments.length > 0, 'Dependency URI instance cannot be empty')
  const pathSegments = path.split('/').filter(s => s.length > 0)
  invariant(pathSegments.length > 0, 'Dependency URI path cannot be empty')
  return URI.from({
    scheme: DEPENDENCY_URI_SCHEME,
    authority,
    path: `/${instanceSegments.join('/')}/${SEPARATOR}/${pathSegments.join('/')}`,
  })
}

/**
 * Parses a URI of a document of an external project.
 * Returns undefined if the URI is not a valid dependency URI.
 */
export function parseDependencyUri(uri: URI | string): DependencyUri | undefined {
  if (!isDependencyUri(uri)) {
    return undefined
  }
  const parsed = typeof uri === 'string' ? URI.parse(uri) : uri
  const segments = parsed.path.split('/')
  // segments[0] is empty (path starts with "/")
  const separator = segments.indexOf(SEPARATOR, 1)
  if (!parsed.authority || separator < 2) {
    return undefined
  }
  const path = segments.slice(separator + 1).filter(s => s.length > 0).join('/')
  if (path.length === 0) {
    return undefined
  }
  return {
    authority: parsed.authority,
    instance: segments.slice(0, separator).map(unescapeInstanceSegment).join('/'),
    path,
  }
}

function withoutTrailingSlash(path: string): string {
  return path.endsWith('/') ? path.slice(0, -1) : path
}

/**
 * Checks if a local dependency can be loaded from the folder (a local `file` folder, not a UNC path).
 */
export function isValidLocalDependencyFolder(folder: URI): boolean {
  return folder.scheme === 'file' && !folder.authority
}

/**
 * Builds the URI of a file of a local dependency loaded from the folder.
 *
 * @param folder folder of the dependency (`file` URI)
 * @param file file inside the folder (`file` URI)
 */
export function localDependencyUri(folder: URI, file: URI): URI {
  invariant(folder.scheme === 'file' && !folder.authority, `Local dependency must be a local folder: ${folder}`)
  // URI.toString() normalizes Windows drive letters (lower case), parse back to have the same path
  const instance = withoutTrailingSlash(URI.parse(folder.toString()).path)
  const filePath = URI.parse(file.toString()).path
  invariant(filePath.startsWith(`${instance}/`), `File ${file} is not inside the dependency folder ${folder}`)
  return buildDependencyUri({
    authority: LOCAL_DEPENDENCY_AUTHORITY,
    instance,
    path: filePath.slice(instance.length + 1),
  })
}

/**
 * Returns the folder of a local dependency (`file` URI, without trailing slash) the document belongs to,
 * or undefined if the URI is not a URI of a local dependency.
 */
export function localDependencyFolder(uri: URI | string | DependencyUri): URI | undefined {
  const parsed = typeof uri === 'string' || URI.isUri(uri) ? parseDependencyUri(uri) : uri
  if (!parsed || parsed.authority !== LOCAL_DEPENDENCY_AUTHORITY) {
    return undefined
  }
  return URI.from({ scheme: 'file', path: parsed.instance })
}

/**
 * Returns the `file` URI of a document of a local dependency (instance folder + path),
 * or undefined if the URI is not a URI of a local dependency (e.g. a git dependency).
 */
export function localDependencyFile(uri: URI | string): URI | undefined {
  const parsed = parseDependencyUri(uri)
  if (!parsed || parsed.authority !== LOCAL_DEPENDENCY_AUTHORITY) {
    return undefined
  }
  return URI.from({ scheme: 'file', path: `${parsed.instance}/${parsed.path}` })
}

/**
 * The URI of the source of a document:
 * the real `file` URI for a document of a local dependency, the document URI otherwise
 * (documents of the workspace, and of non-local dependencies, which have no file).
 *
 * Use it wherever a document URI is a base to resolve relative paths (icons, links, description files),
 * or is exposed as a file location.
 */
export function documentSourceUri(uri: URI): URI {
  if (!isDependencyUri(uri)) {
    return uri
  }
  return localDependencyFile(uri) ?? uri
}

/**
 * Commit SHA in a git dependency URI: lower case hex (SHA-1 or SHA-256, abbreviated SHAs are accepted)
 */
const GIT_SHA_REGEX = /^[0-9a-f]{7,64}$/

/**
 * Last segment of the repository path with the SHA: `<name>@<sha>`
 */
const GIT_REPOSITORY_SEGMENT_REGEX = /^(.+)@([0-9a-f]{7,64})$/

/**
 * Full commit SHA: lower case hex, 40 (SHA-1) or 64 (SHA-256) characters
 */
const FULL_GIT_SHA_REGEX = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/

/**
 * Checks if the string looks like a commit SHA (lower case hex, 7 to 64 characters, abbreviated SHAs included).
 * Used when parsing URIs; building URIs and keys requires {@link isFullGitSha}.
 */
export function isGitSha(value: string): boolean {
  return GIT_SHA_REGEX.test(value)
}

/**
 * Checks if the string is a full commit SHA (lower case hex, 40 or 64 characters).
 * Instances, cache keys and version records use full SHAs only,
 * so one commit never gets two instances (abbreviated and full).
 */
export function isFullGitSha(value: string): boolean {
  return FULL_GIT_SHA_REGEX.test(value)
}

/**
 * Instance of a git dependency: the triple "repository, SHA, subdirectory".
 * Projects that use the same instance share its documents.
 */
export interface GitDependencyInstance {
  /**
   * Identity of the repository: `host[:port]/path` (see `parseGitRepositoryUrl(url).id` of `@likec4/config`),
   * e.g. `github.com/my-org/billing`
   */
  readonly repository: string
  /**
   * Full commit SHA (lower case hex, 40 or 64 characters, see {@link isFullGitSha})
   */
  readonly sha: string
  /**
   * Subdirectory of the repository with the dependency project,
   * normalized with {@link normalizeGitSubdir}: `''` for the repository root
   */
  readonly subdir: string
}

/**
 * Normalizes a subdirectory of a git repository: forward slashes, without leading `./` and slashes,
 * without trailing and repeated slashes. Returns `''` for the repository root (`undefined`, `''`, `.`, `/`).
 *
 * @throws if the path contains `..` segments
 */
export function normalizeGitSubdir(subdir: string | undefined): string {
  const segments = (subdir ?? '')
    .trim()
    .replaceAll('\\', '/')
    .split('/')
    .filter(s => s.length > 0 && s !== '.')
  invariant(!segments.includes('..'), `Subdirectory of a git dependency cannot contain "..": ${subdir}`)
  return segments.join('/')
}

function splitRepository(repository: string): { authority: string; segments: string[] } {
  const [authority = '', ...segments] = repository.split('/').filter(s => s.length > 0)
  invariant(authority.length > 0 && segments.length > 0, `Invalid git repository identity: ${repository}`)
  return { authority, segments }
}

/**
 * Builds the URI of a file of a git dependency instance:
 *
 * ```
 * likec4-dep://<host>[:<port>]/<repository path>@<sha>[/<subdir>]/-/<path>
 * ```
 *
 * The instance (repository, SHA, subdirectory) precedes the `-` separator,
 * the path of the file relative to the subdirectory follows it.
 *
 * Note: `URI.toString()` encodes `@` as `%40` (`.../billing%40<sha>/-/...`):
 * compare URIs via {@link parseGitDependencyUri} (or as `URI` strings built the same way), never by a literal `@`.
 *
 * @throws if the SHA is not a full SHA (see {@link isFullGitSha})
 *
 * @example
 * ```ts
 * gitDependencyUri({ repository: 'github.com/my-org/billing', sha, subdir: 'architecture' }, 'model.c4')
 * // likec4-dep://github.com/my-org/billing@<sha>/architecture/-/model.c4
 * ```
 */
export function gitDependencyUri(instance: GitDependencyInstance, path: string): URI {
  invariant(isFullGitSha(instance.sha), `Git dependency requires a full commit SHA: ${instance.sha}`)
  const { authority, segments } = splitRepository(instance.repository)
  const subdir = normalizeGitSubdir(instance.subdir)
  const repositoryPath = segments.join('/')
  return buildDependencyUri({
    authority,
    instance: `/${repositoryPath}@${instance.sha}${subdir ? `/${subdir}` : ''}`,
    path,
  })
}

/**
 * Parsed URI of a document of a git dependency, see {@link parseGitDependencyUri}
 */
export interface GitDependencyDocumentUri {
  readonly instance: GitDependencyInstance
  /**
   * Path of the file relative to the subdirectory of the instance
   */
  readonly path: string
}

/**
 * Parses the URI of a document of a git dependency (built by {@link gitDependencyUri}).
 * Returns undefined for other URIs (including local dependencies).
 *
 * The repository path ends at the first segment `<name>@<sha>`, the rest of the instance is the subdirectory.
 */
export function parseGitDependencyUri(uri: URI | string | DependencyUri): GitDependencyDocumentUri | undefined {
  const parsed = typeof uri === 'string' || URI.isUri(uri) ? parseDependencyUri(uri) : uri
  if (!parsed || parsed.authority === LOCAL_DEPENDENCY_AUTHORITY) {
    return undefined
  }
  // instance starts with "/"
  const segments = parsed.instance.split('/').slice(1)
  for (const [index, segment] of segments.entries()) {
    const match = GIT_REPOSITORY_SEGMENT_REGEX.exec(segment)
    if (!match) {
      continue
    }
    const [, name = '', sha = ''] = match
    return {
      instance: {
        repository: [parsed.authority, ...segments.slice(0, index), name].join('/'),
        sha,
        subdir: segments.slice(index + 1).join('/'),
      },
      path: parsed.path,
    }
  }
  return undefined
}
