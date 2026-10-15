import type { EdgeRouting } from '@likec4/core/types'

/**
 * Returns a view's resolved routing mode, defaulting to `spline` when omitted.
 */
export function viewRouting(view: { readonly routing?: EdgeRouting | undefined }): EdgeRouting {
  return view.routing ?? 'spline'
}
