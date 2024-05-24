import { LikeC4Browser, type LikeC4ViewBaseProps, LikeC4ViewElement as LikeC4ViewComponent } from 'likec4/react'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { isLikeC4ViewId, type LikeC4ViewId, LikeC4Views } from 'virtual:likec4/views'

export { isLikeC4ViewId }

export type LikeC4ViewProps = LikeC4ViewBaseProps<LikeC4ViewId>

export function LikeC4View({
  viewId,
  interactive = true,
  colorScheme,
  injectFontCss = true,
  overlay,
  ...props
}: LikeC4ViewProps) {
  const view = LikeC4Views[viewId]

  const [browserViewId, onNavigateTo] = useState(null as LikeC4ViewId | null)

  const browserView = browserViewId ? LikeC4Views[browserViewId] : null

  if (!view) {
    throw new Error(`View with id ${viewId} not found`)
  }

  if (browserViewId && !browserView) {
    throw new Error(`View with id ${browserViewId} not found`)
  }

  return (
    <>
      <LikeC4ViewComponent<LikeC4ViewId>
        view={view}
        colorScheme={colorScheme}
        injectFontCss={injectFontCss}
        onNavigateTo={interactive ? onNavigateTo : undefined}
        {...props}
      />
      {browserView && (createPortal(
        <LikeC4Browser<LikeC4ViewId>
          view={browserView}
          injectFontCss={false}
          colorScheme={colorScheme}
          overlay={overlay}
          onNavigateTo={onNavigateTo}
          background="dots"
          onClose={() => onNavigateTo(null)}
        />,
        document.body,
        view.id
      ))}
    </>
  )
}
