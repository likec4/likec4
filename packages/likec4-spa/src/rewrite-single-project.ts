// SPDX-License-Identifier: MIT

const REWRITTEN_SEGMENTS = ['view', 'embed', 'export'] as const

export type SingleProjectRewriteOptions = {
  /**
   * When false, helpers are no-ops (return undefined).
   * Caller snapshots this once at router create from `isSingleProject`.
   */
  enabled: boolean
  /** First project id; used to build `/project/<id>` prefix. */
  firstProjectId: string
}

function projectPrefix(firstProjectId: string): string {
  return `/project/${firstProjectId}`
}

function shouldRewriteInputPath(pathname: string): boolean {
  for (const segment of REWRITTEN_SEGMENTS) {
    if (pathname === `/${segment}` || pathname.startsWith(`/${segment}/`)) {
      return true
    }
  }
  return false
}

/**
 * Maps public single-project URLs (`/view/...`, `/embed/...`, `/export/...`)
 * onto the canonical multi-project tree under `/project/<id>/...`.
 *
 * Leaves `/`, `/projects`, `/project/...`, `/single-index`, `/webcomponent` alone.
 * Does not rewrite `/` → `/project/<id>/` (avoids a root redirect loop).
 * Does not add/strip trailing slashes; preserves search and hash.
 */
export function rewriteSingleProjectInput(
  url: URL,
  options: SingleProjectRewriteOptions,
): URL | undefined {
  if (!options.enabled) {
    return undefined
  }
  const { pathname } = url
  if (!shouldRewriteInputPath(pathname)) {
    return undefined
  }
  const next = new URL(url.href)
  next.pathname = `${projectPrefix(options.firstProjectId)}${pathname}`
  return next
}

/**
 * Strips `/project/<id>` from internal locations so the public URL stays
 * without the project prefix in single-project mode.
 *
 * Maps bare `prefix` / `prefix/` → `/`.
 * Does not add/strip trailing slashes on other paths; preserves search and hash.
 */
export function rewriteSingleProjectOutput(
  url: URL,
  options: SingleProjectRewriteOptions,
): URL | undefined {
  if (!options.enabled) {
    return undefined
  }
  const prefix = projectPrefix(options.firstProjectId)
  const { pathname } = url
  if (pathname === prefix || pathname === `${prefix}/`) {
    const next = new URL(url.href)
    next.pathname = '/'
    return next
  }
  if (pathname.startsWith(`${prefix}/`)) {
    const next = new URL(url.href)
    next.pathname = pathname.slice(prefix.length)
    return next
  }
  return undefined
}
