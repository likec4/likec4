import type { DynamicViewDisplayVariant, LayoutedView } from '@likec4/core/types'

export function getViewBounds(view: LayoutedView, dynamicVariant?: DynamicViewDisplayVariant) {
  if (view._type === 'dynamic') {
    try {
      dynamicVariant ??= view.variant
      if (dynamicVariant === 'sequence') {
        return view.sequenceLayout.bounds
      }
    } catch {
      // noop
    }
  }
  return view.bounds
}
