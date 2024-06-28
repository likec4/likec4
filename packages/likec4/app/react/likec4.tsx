import { LikeC4Browser, type LikeC4ViewBaseProps, LikeC4ViewElement } from 'likec4/react'
import { useCallback, useState } from 'react'
import { isLikeC4ViewId, type LikeC4ViewId, LikeC4Views } from 'virtual:likec4/views'

export { isLikeC4ViewId }
export type LikeC4ViewProps = LikeC4ViewBaseProps<LikeC4ViewId>

export function LikeC4View({
  viewId,
  interactive = true,
  colorScheme,
  injectFontCss = true,
  ...props
}: LikeC4ViewProps) {
  const view = LikeC4Views[viewId]

  const [browserViewId, onNavigateTo] = useState(null as LikeC4ViewId | null)

  const browserView = browserViewId ? LikeC4Views[browserViewId] : null

  const closeBrowser = useCallback(() => {
    onNavigateTo(null)
  }, [onNavigateTo])

  if (!view) {
    throw new Error(`View with id ${viewId} not found`)
  }

  if (browserViewId && !browserView) {
    throw new Error(`View with id ${browserViewId} not found`)
  }

  return (
    <>
      <LikeC4ViewElement<LikeC4ViewId>
        view={view}
        colorScheme={colorScheme}
        injectFontCss={injectFontCss}
        onNavigateTo={interactive ? onNavigateTo : undefined}
        {...props}
      />
      {browserView && (
        <LikeC4Browser<LikeC4ViewId>
          view={browserView}
          injectFontCss={false}
          colorScheme={colorScheme}
          onNavigateTo={onNavigateTo}
          background="dots"
          onClose={closeBrowser}
        />
      )}
    </>
  )
}
