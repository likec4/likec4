import type { LikeC4ViewProps as BaseLikeC4ViewProps } from 'likec4/react'
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

function RenderIcon({ node }: IconRendererProps) {
  const IconComponent = Icons[node.icon ?? '']
  return IconComponent ? <IconComponent /> : null
}

export { isLikeC4ViewId, LikeC4Views, RenderIcon }

export type LikeC4ViewProps = BaseLikeC4ViewProps<LikeC4ViewId, LikeC4Tag, LikeC4ElementKind>

const NotFound = ({ viewId }: { viewId: string }) => (
  <div
    style={{
      margin: '1rem 0'
    }}>
    <div
      style={{
        margin: '0 auto',
        display: 'inline-block',
        padding: '2rem',
        background: 'rgba(250,82,82,.15)',
        color: '#ffa8a8'
      }}>
      View <code>{viewId}</code> not found
    </div>
  </div>
)

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
  browserClassName,
  browserStyle,
  ...props
}) {
  const view = LikeC4Views[viewId]

  const [browserViewId, onNavigateTo] = useState(null as LikeC4ViewId | null)

  const browserView = browserViewId ? LikeC4Views[browserViewId] : null

  const closeBrowser = useCallback(() => {
    onNavigateTo(null)
  }, [onNavigateTo])

  const colorScheme = useColorScheme(explicitColorScheme)

  if (!view) {
    return <NotFound viewId={viewId} />
  }

  if (browserViewId && !browserView) {
    return <NotFound viewId={browserViewId} />
  }

  if (interactive && enableFocusMode) {
    console.warn('Focus mode is not supported in interactive mode')
  }

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
          className={browserClassName}
          style={browserStyle}
        />
      )}
    </>
  )
})
LikeC4View.displayName = 'LikeC4View'
