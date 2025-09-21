import type * as t from '@likec4/core/types'
import { cx } from '@likec4/styles/css'
import { type CSSProperties } from 'react'
import { ErrorMessage, ViewNotFound } from './components/ViewNotFound'
import { useOptionalLikeC4Model } from './hooks/useLikeC4Model'
import { type LikeC4DiagramProps, LikeC4Diagram } from './LikeC4Diagram'
import type { LikeC4View } from './LikeC4View'
import { ShadowRoot } from './shadowroot/ShadowRoot'

export type ReactLikeC4Props<A extends t.aux.Any = t.aux.UnknownLayouted> = Omit<LikeC4DiagramProps<A>, 'view'> & {
  viewId: t.aux.ViewId<A>

  /**
   * Keep aspect ratio of the diagram
   *
   * @default false
   */
  keepAspectRatio?: boolean | undefined

  /**
   * By default determined by the user's system preferences.
   */
  colorScheme?: 'light' | 'dark' | undefined

  /**
   * LikeC4 views are using 'IBM Plex Sans' font.
   * By default, component injects the CSS to document head.
   * Set to false if you want to handle the font yourself.
   *
   * @default true
   */
  injectFontCss?: boolean | undefined

  style?: CSSProperties | undefined

  mantineTheme?: any

  /** Function to generate nonce attribute added to all generated `<style />` tags */
  styleNonce?: string | (() => string) | undefined
}

/**
 * Ready-to-use component to display embedded LikeC4 view, same as {@link LikeC4View}
 * But provides more control over the diagram
 *
 * Component is wrapped in ShadowRoot to isolate styles.
 */
export function ReactLikeC4<A extends t.aux.Any = t.aux.UnknownLayouted>({
  viewId,
  ...props
}: ReactLikeC4Props<A>) {
  const likec4model = useOptionalLikeC4Model()

  if (!likec4model) {
    return (
      <ErrorMessage>
        LikeC4Model not found. Make sure you provided LikeC4ModelProvider.
      </ErrorMessage>
    )
  }
  const view = likec4model.findView(viewId)

  if (!view) {
    return <ViewNotFound viewId={viewId} />
  }

  if (!view.isDiagram()) {
    return (
      <ErrorMessage>
        LikeC4 View "${viewId}" is not layouted. Make sure you have LikeC4ModelProvider with layouted model.
      </ErrorMessage>
    )
  }

  return <ReactLikeC4Inner view={view.$view} {...props} />
}

type ReactLikeC4InnerProps<A extends t.aux.Any> = Omit<ReactLikeC4Props<A>, 'viewId'> & {
  view: t.DiagramView<A>
}
function ReactLikeC4Inner<A extends t.aux.Any>({
  className,
  view,
  colorScheme,
  injectFontCss = true,
  keepAspectRatio,
  showNotations,
  style,
  mantineTheme,
  styleNonce,
  ...props
}: ReactLikeC4InnerProps<A>) {
  const notations = view.notation?.nodes ?? []
  const hasNotations = notations.length > 0
  showNotations ??= hasNotations

  return (
    <ShadowRoot
      injectFontCss={injectFontCss}
      theme={mantineTheme}
      colorScheme={colorScheme}
      styleNonce={styleNonce}
      keepAspectRatio={keepAspectRatio ? view.bounds : false}
      className={cx(
        'likec4-view',
        className,
      )}
      style={style}>
      <LikeC4Diagram
        view={view as any}
        showNotations={showNotations}
        {...props}
      />
    </ShadowRoot>
  )
}
ReactLikeC4.displayName = 'ReactLikeC4'
