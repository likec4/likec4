import type { LikeC4ViewBaseProps } from 'likec4/react'
import { LikeC4Browser, LikeC4ViewElement, useColorScheme } from 'likec4/react'
import { memo, useCallback, useState } from 'react'
import { Icons } from 'virtual:likec4/icons'
import {
  isLikeC4ViewId,
  type LikeC4ElementKind,
  type LikeC4Tag,
  type LikeC4ViewId,
  LikeC4Views
} from 'virtual:likec4/views'

type IconRendererProps = {
  node: {
    id: string
    title: string
    icon?: string | undefined
  }
}

const RenderIcon = ({ node }: IconRendererProps) => {
  const IconComponent = Icons[node.icon ?? '']
  return IconComponent ? <IconComponent /> : null
}

export { isLikeC4ViewId }

export type LikeC4ViewProps = LikeC4ViewBaseProps<LikeC4ViewId, LikeC4Tag, LikeC4ElementKind>

export const LikeC4View = /* @__PURE__ */ memo<LikeC4ViewProps>(function LikeC4ViewComponent({
  viewId,
  interactive = true,
  colorScheme: explicitColorScheme,
  injectFontCss = true,
  background = 'transparent',
  browserBackground = 'dots',
  where,
  showElementLinks = true,
  showDiagramTitle = false,
  showNavigationButtons = false,
  showNotations = false,
  enableFocusMode = false,
  ...props
}) {
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

  if (interactive && enableFocusMode) {
    console.warn('Focus mode is not supported in interactive mode')
  }

  const colorScheme = useColorScheme(explicitColorScheme)

  return (
    <>
      <LikeC4ViewElement<LikeC4ViewId, LikeC4Tag, LikeC4ElementKind>
        view={view}
        colorScheme={colorScheme}
        injectFontCss={injectFontCss}
        onNavigateTo={interactive ? onNavigateTo : undefined}
        background={background}
        renderIcon={RenderIcon}
        showElementLinks={showElementLinks}
        showDiagramTitle={showDiagramTitle}
        showNavigationButtons={showNavigationButtons}
        showNotations={showNotations}
        enableFocusMode={enableFocusMode}
        where={where}
        {...props}
      />
      {browserView && (
        <LikeC4Browser<LikeC4ViewId, LikeC4Tag, LikeC4ElementKind>
          view={browserView}
          injectFontCss={false}
          colorScheme={colorScheme}
          onNavigateTo={onNavigateTo}
          background={browserBackground}
          onClose={closeBrowser}
          renderIcon={RenderIcon}
          where={where}
        />
      )}
    </>
  )
})
LikeC4View.displayName = 'LikeC4View'
