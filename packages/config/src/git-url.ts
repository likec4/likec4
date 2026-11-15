/**
 * Form of a git repository URL:
 * - `https` - `https://host[:port]/org/repo.git`
 * - `ssh` - `ssh://[user@]host[:port]/org/repo.git`
 * - `scp` - scp-like `[user@]host:org/repo.git`
 */
export type GitUrlProtocol = 'https' | 'ssh' | 'scp'

/**
 * Parsed git repository URL, see {@link parseGitRepositoryUrl}.
 */
export interface GitRepositoryUrl {
  /**
   * Form of the URL
   */
  protocol: GitUrlProtocol
  /**
   * Host name, lower case, without port
   */
  host: string
  /**
   * Port, only if it is not the default one of the protocol (443 for https, 22 for ssh)
   */
  port?: number | undefined
  /**
   * Path of the repository on the host: without leading and trailing slashes and without the `.git` suffix,
   * case is preserved (e.g. `my-org/billing`)
   */
  path: string
  /**
   * Identity of the repository: `host[:port]/path` (e.g. `github.com/my-org/billing`).
   *
   * Different spellings of the same repository (https, ssh, scp-like, with or without user, `.git` suffix,
   * trailing slash or default port) have the same identity.
   */
  id: string
}

const DEFAULT_PORTS: Record<'https' | 'ssh', number> = {
  https: 443,
  ssh: 22,
}

// [user@]host:path, where path does not start with "/" (scp-like syntax of git)
const SCP_LIKE_REGEX = /^(?:[^@/:\s]+@)?([^@/:\s[\]]+):(?!\/)(\S+)$/

const HOST_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/

function normalizeRepositoryPath(path: string): string | undefined {
  const segments = path
    .split('/')
    .filter(s => s.length > 0)
  const last = segments.at(-1)
  if (last?.endsWith('.git')) {
    const name = last.slice(0, -'.git'.length)
    if (name.length === 0) {
      segments.pop()
    } else {
      segments[segments.length - 1] = name
    }
  }
  if (segments.length === 0 || segments.some(s => s === '.' || s === '..' || /[\s\\]/.test(s))) {
    return undefined
  }
  return segments.join('/')
}

function hasDotSegments(value: string): boolean {
  let decoded: string
  try {
    decoded = decodeURIComponent(value)
  } catch {
    return true
  }
  return decoded.split(/[/\\]/).some(s => s === '.' || s === '..')
}

function result(
  protocol: GitUrlProtocol,
  hostname: string,
  port: number | undefined,
  rawPath: string,
): GitRepositoryUrl | undefined {
  const host = hostname.toLowerCase()
  if (!HOST_REGEX.test(host)) {
    return undefined
  }
  const path = normalizeRepositoryPath(rawPath)
  if (!path) {
    return undefined
  }
  const effectivePort = protocol !== 'scp' && port === DEFAULT_PORTS[protocol] ? undefined : port
  return {
    protocol,
    host,
    ...(effectivePort !== undefined && { port: effectivePort }),
    path,
    id: `${host}${effectivePort !== undefined ? `:${effectivePort}` : ''}/${path}`,
  }
}

/**
 * Parses a git repository URL of one of the supported forms: `https://`, `ssh://` and scp-like `git@host:org/repo.git`.
 * Returns undefined for other forms (`http://`, `file://`, `git://`, `ext::`, local paths, ...)
 * and for malformed URLs.
 *
 * URLs with a query string or a fragment are rejected.
 * The user (and password) of the URL is not a part of the repository identity ({@link GitRepositoryUrl.id}).
 *
 * @example
 * ```ts
 * parseGitRepositoryUrl('git@github.com:my-org/billing.git')?.id // 'github.com/my-org/billing'
 * parseGitRepositoryUrl('https://github.com/my-org/billing')?.id // 'github.com/my-org/billing'
 * parseGitRepositoryUrl('ssh://git@example.com:2222/my-org/billing.git')?.id // 'example.com:2222/my-org/billing'
 * ```
 */
export function parseGitRepositoryUrl(url: string): GitRepositoryUrl | undefined {
  const value = url.trim()
  if (value.length === 0) {
    return undefined
  }
  const protocol = /^([a-z][a-z0-9+.-]*):\/\//i.exec(value)?.[1]?.toLowerCase()
  if (protocol === undefined) {
    const scp = SCP_LIKE_REGEX.exec(value)
    if (!scp) {
      return undefined
    }
    const [, host = '', path = ''] = scp
    // "C:repo" is a Windows path with a drive letter, not a host
    if (host.length < 2) {
      return undefined
    }
    return result('scp', host, undefined, path)
  }
  if (protocol !== 'https' && protocol !== 'ssh') {
    return undefined
  }
  // URL resolves dot segments ("a/../b" -> "b"), reject them before parsing
  if (hasDotSegments(value.slice(protocol.length + 3))) {
    return undefined
  }
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    return undefined
  }
  if (parsed.hostname.length === 0 || parsed.search.length > 0 || parsed.hash.length > 0) {
    return undefined
  }
  const port = parsed.port.length > 0 ? Number(parsed.port) : undefined
  let path: string
  try {
    path = decodeURIComponent(parsed.pathname)
  } catch {
    return undefined
  }
  return result(protocol, parsed.hostname, port, path)
}
