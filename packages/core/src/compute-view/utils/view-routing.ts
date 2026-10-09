import type { EdgeRouting } from '../../types'

/**
 * Returns a view with routing resolved from its parsed value or the project default.
 *
 * The parser resolves the view property and `autoLayout` parameter before this step.
 * Omits `routing` when the resolved value is `spline` to preserve existing model output.
 */
export function withResolvedRouting<V extends { readonly routing?: EdgeRouting | undefined }>(
  view: V,
  defaultRouting: EdgeRouting,
): Omit<V, 'routing'> & { readonly routing?: 'ortho' } {
  const { routing: viewRouting, ...rest } = view
  const routing = viewRouting ?? defaultRouting
  return routing === 'ortho' ? { ...rest, routing } : rest
}
