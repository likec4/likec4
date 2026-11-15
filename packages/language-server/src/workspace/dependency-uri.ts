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
 * - git dependency (planned): `likec4-dep://<host>/<repo>@<sha>/-/<path>`,
 *   e.g. `likec4-dep://github.com/my-org/billing@<sha>/-/architecture/model.c4`
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
