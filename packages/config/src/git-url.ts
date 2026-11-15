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
const SCP_LIKE_REGEX = /^(?:([^@/:\s]+)@)?([^@/:\s[\]]+):(?!\/)(\S+)$/

// User of ssh and scp-like URLs: must not look like an option of ssh ("-oProxyCommand=...")
const USER_REGEX = /^[A-Za-z0-9._~][A-Za-z0-9._~-]*$/

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS_REGEX = /[\x00-\x1f\x7f]/

// Encoded "/" and "\" in a path would change the identity of the repository
const ENCODED_SEPARATOR_REGEX = /%2f|%5c/i

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
  // segments starting with "-" could be taken for options of git or ssh
  if (segments.length === 0 || segments.some(s => s === '.' || s === '..' || s.startsWith('-') || /[\s\\:]/.test(s))) {
    return undefined
  }
  return segments.join('/')
}

/**
 * Decodes the path of `https://` and `ssh://` URLs (scp-like paths with `%` are rejected, git does not decode them),
 * so `https://host/org/bill%23ing` and `git@host:org/bill#ing` have one identity.
 * Returns undefined for encoded separators (`%2F`, `%5C`), malformed escapes,
 * control characters and a `%` that remains after decoding.
 */
function decodePath(raw: string): string | undefined {
  if (ENCODED_SEPARATOR_REGEX.test(raw)) {
    return undefined
  }
  let decoded: string
  try {
    decoded = decodeURIComponent(raw)
  } catch {
    return undefined
  }
  if (decoded.includes('%') || CONTROL_CHARS_REGEX.test(decoded)) {
    return undefined
  }
  return decoded
}

function isValidUser(encoded: string): boolean {
  if (encoded.length === 0) {
    return true
  }
  try {
    return USER_REGEX.test(decodeURIComponent(encoded))
  } catch {
    return false
  }
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

/**
 * Checks if a `https://` or `ssh://` URL contains credentials (a password or a token): `scheme://user:secret@host/...`.
 * A user name alone (`ssh://git@host/...`) is not a credential.
 *
 * Credentials must not be stored in the config: use a git credential helper or SSH keys instead.
 */
export function hasGitUrlCredentials(url: string): boolean {
  const match = /^[a-z][a-z0-9+.-]*:\/\/([^/?#]*)/i.exec(url.trim())
  const authority = match?.[1]
  if (!authority) {
    return false
  }
  const at = authority.lastIndexOf('@')
  return at >= 0 && authority.slice(0, at).includes(':')
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
 * Rejected as well:
 * - remote helper syntax (anything with `::`, e.g. `ext::sh -c ...`)
 * - a query string or a fragment
 * - path segments with `:`, `.` or `..`, segments starting with `-`, encoded `/` and `\` (`%2F`, `%5C`)
 * - control characters, a `%` that remains after decoding the path
 *
 * - `%` in scp-like paths (git passes them to the server as written)
 *
 * Paths of `https://` and `ssh://` URLs are percent-decoded, so `git@host:org/bill#ing` and
 * `https://host/org/bill%23ing` have the same identity.
 * - users that start with `-` or contain characters other than `A-Z a-z 0-9 . _ ~ -` (ssh option injection)
 * - hosts that are not plain host names (start with `-`, IPv6 literals)
 *
 * - credentials (`https://user:token@host/...`), see {@link hasGitUrlCredentials}
 *
 * The user of the URL is not a part of the repository identity ({@link GitRepositoryUrl.id}).
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
  // "::" is the syntax of git remote helpers ("ext::sh -c ...", "fd::17")
  if (value.length === 0 || value.includes('::') || CONTROL_CHARS_REGEX.test(value)) {
    return undefined
  }
  const protocol = /^([a-z][a-z0-9+.-]*):\/\//i.exec(value)?.[1]?.toLowerCase()
  if (protocol === undefined) {
    const scp = SCP_LIKE_REGEX.exec(value)
    if (!scp) {
      return undefined
    }
    const [, user, host = '', rawPath = ''] = scp
    // "C:repo" is a Windows path with a drive letter, not a host
    if (host.length < 2 || (user !== undefined && !USER_REGEX.test(user))) {
      return undefined
    }
    // git passes scp-like paths to the server as written (no percent-decoding):
    // escapes are rejected, so the identity is the path as written
    if (rawPath.includes('%')) {
      return undefined
    }
    const path = decodePath(rawPath)
    return path === undefined ? undefined : result('scp', host, undefined, path)
  }
  if (protocol !== 'https' && protocol !== 'ssh') {
    return undefined
  }
  if (hasGitUrlCredentials(value)) {
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
  if (
    parsed.hostname.length === 0
    || parsed.search.length > 0
    || parsed.hash.length > 0
    || parsed.password.length > 0
    || !isValidUser(parsed.username)
  ) {
    return undefined
  }
  const port = parsed.port.length > 0 ? Number(parsed.port) : undefined
  const path = decodePath(parsed.pathname)
  return path === undefined ? undefined : result(protocol, parsed.hostname, port, path)
}
