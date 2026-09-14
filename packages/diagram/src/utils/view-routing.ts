import type { EdgeRouting } from '@likec4/core/types'

/**
 * Edge routing of a view, `spline` when the view does not set one.
 */
export function viewRouting(view: { readonly routing?: EdgeRouting | undefined }): EdgeRouting {
  return view.routing ?? 'spline'
}
