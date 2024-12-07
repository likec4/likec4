import {
  LikeC4Browser,
  type LikeC4Model,
  LikeC4ModelProvider as GenericLikeC4ModelProvider,
  LikeC4ViewEmbedded,
  type LikeC4ViewProps as BaseLikeC4ViewProps,
  ReactLikeC4 as GenericReactLikeC4,
  type ReactLikeC4Props as GenericReactLikeC4Props,
  useColorScheme,
  ViewNotFound
} from 'likec4/react'
import { memo, type PropsWithChildren, useCallback, useState } from 'react'
import { Icons } from 'virtual:likec4/icons'
import type { DiagramView, LikeC4ElementKind, LikeC4Tag, LikeC4ViewId } from 'virtual:likec4/model'
import { likeC4Model, LikeC4Views, useLikeC4Model } from 'virtual:likec4/model'

type IconRendererProps = {
  node: {
    id: string
    title: string
    icon?: string | undefined
  }
}

export function RenderIcon({ node }: IconRendererProps) {
  const IconComponent = Icons[node.icon ?? '']
  return IconComponent ? <IconComponent /> : null
}

export { likeC4Model, LikeC4Views, useLikeC4Model }

export const useLikeC4ViewModel = (viewId: LikeC4ViewId): LikeC4Model.View => useLikeC4Model().view(viewId as any)

export const useLikeC4View = (viewId: LikeC4ViewId): DiagramView =>
  useLikeC4Model().view(viewId as any).$view as DiagramView

export type LikeC4ViewProps = BaseLikeC4ViewProps<LikeC4ViewId, LikeC4Tag, LikeC4ElementKind>

export function isLikeC4ViewId(value: unknown): value is LikeC4ViewId {
  return (
    value != null
    && typeof value === 'string'
    && value in LikeC4Views
  )
}

export function LikeC4ModelProvider({ children }: PropsWithChildren) {
  const likeC4Model = useLikeC4Model()
  return (
    <GenericLikeC4ModelProvider likec4model={likeC4Model}>
      {children}
    </GenericLikeC4ModelProvider>
  )
}

const LikeC4ViewMemo = /* @__PURE__ */ memo<LikeC4ViewProps>(function LikeC4View({
  viewId,
  interactive = true,
  colorScheme: explicitColorScheme,
  injectFontCss = true,
  background = 'transparent',
  browserBackground = 'dots',
  where,
  showDiagramTitle = false,
  showNavigationButtons = false,
  showNotations = false,
  enableFocusMode = false,
  enableElementDetails = false,
  enableRelationshipDetails = false,
  enableRelationshipBrowser = enableRelationshipDetails,
  browserClassName,
  browserStyle,
  mantineTheme,
  styleNonce,
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
    return <ViewNotFound viewId={viewId} />
  }

  if (browserViewId && !browserView) {
    return <ViewNotFound viewId={browserViewId} />
  }

  if (interactive && enableFocusMode) {
    console.warn('Focus mode is not supported in interactive mode')
  }

  return (
    <LikeC4ModelProvider>
      <LikeC4ViewEmbedded<LikeC4ViewId, LikeC4Tag, LikeC4ElementKind>
        view={view}
        colorScheme={colorScheme}
        injectFontCss={injectFontCss}
        onNavigateTo={interactive ? onNavigateTo : undefined}
        background={background}
        renderIcon={RenderIcon}
        showDiagramTitle={showDiagramTitle}
        showNavigationButtons={showNavigationButtons}
        showNotations={showNotations}
        enableFocusMode={enableFocusMode}
        enableElementDetails={enableElementDetails}
        enableRelationshipBrowser={enableRelationshipBrowser}
        enableRelationshipDetails={enableRelationshipDetails}
        where={where}
        mantineTheme={mantineTheme}
        styleNonce={styleNonce}
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
          mantineTheme={mantineTheme}
          styleNonce={styleNonce}
          enableElementDetails
          enableRelationshipBrowser
          enableRelationshipDetails
        />
      )}
    </LikeC4ModelProvider>
  )
})
LikeC4ViewMemo.displayName = 'LikeC4ViewMemo'

export type ReactLikeC4Props =
  & Omit<GenericReactLikeC4Props<LikeC4ViewId, LikeC4Tag, LikeC4ElementKind>, 'view' | 'renderIcon'>
  & {
    viewId: LikeC4ViewId
  }

const ReactLikeC4Memo = /* @__PURE__ */ memo<ReactLikeC4Props>(function ReactLikeC4({ viewId, ...props }) {
  const view = LikeC4Views[viewId]
  if (!view) {
    return <ViewNotFound viewId={viewId} />
  }
  return (
    <LikeC4ModelProvider>
      <GenericReactLikeC4
        view={view}
        renderIcon={RenderIcon}
        {...props}
      />
    </LikeC4ModelProvider>
  )
})
ReactLikeC4Memo.displayName = 'ReactLikeC4Memo'

export { LikeC4ViewMemo as LikeC4View, ReactLikeC4Memo as ReactLikeC4 }
