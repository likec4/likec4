import type { EdgeRouting } from '../../types'

/**
 * Strips the parsed `routing` from a view and re-adds it resolved
 * (the view's own value, then the project default), present only when `ortho`,
 * so views with the default `spline` routing stay unchanged.
 */
export function withResolvedRouting<V extends { readonly routing?: EdgeRouting | undefined }>(
  view: V,
  defaultRouting: EdgeRouting,
): Omit<V, 'routing'> & { readonly routing?: 'ortho' } {
  const { routing: viewRouting, ...rest } = view
  const routing = viewRouting ?? defaultRouting
  return routing === 'ortho' ? { ...rest, routing } : rest
}
