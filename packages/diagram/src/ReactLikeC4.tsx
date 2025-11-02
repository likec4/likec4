import type * as t from '@likec4/core/types'
import { cx } from '@likec4/styles/css'
import type { CSSProperties } from 'react'
import type { Except } from 'type-fest'
import { ErrorMessage, ViewNotFound } from './components/ViewNotFound'
import { useOptionalLikeC4Model } from './hooks/useLikeC4Model'
import { LikeC4Diagram } from './LikeC4Diagram'
import type { LikeC4DiagramEventHandlers, LikeC4DiagramProperties } from './LikeC4Diagram.props'
import { ShadowRoot } from './shadowroot/ShadowRoot'
import { pickViewBounds } from './utils'

export type ReactLikeC4Props<A extends t.aux.Any = t.aux.UnknownLayouted> =
  & {
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

    children?: React.ReactNode | undefined
  }
  & Except<LikeC4DiagramProperties<A>, 'view', { requireExactProps: true }>
  & LikeC4DiagramEventHandlers<A>

/**
 * Ready-to-use component to display embedded LikeC4 view, same as {@link LikeC4View}
 * But provides more control over the diagram
 *
 * Component is wrapped in ShadowRoot to isolate styles.
 */
export function ReactLikeC4<A extends t.aux.Any = t.aux.UnknownLayouted>({
  viewId,
  className,
  colorScheme,
  injectFontCss = true,
  enableNotations,
  keepAspectRatio,
  style,
  mantineTheme,
  styleNonce,
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
  const view = likec4model.findView(viewId)?.$view

  if (!view) {
    return <ViewNotFound viewId={viewId} />
  }

  if (view._stage !== 'layouted') {
    return (
      <ErrorMessage>
        LikeC4 View "${viewId}" is not layouted. Make sure you have LikeC4ModelProvider with layouted model.
      </ErrorMessage>
    )
  }
  const bounds = pickViewBounds(view, props.dynamicViewVariant)

  const hasNotations = !!enableNotations && (view.notation?.nodes?.length ?? 0) > 0

  return (
    <ShadowRoot
      injectFontCss={injectFontCss}
      theme={mantineTheme}
      colorScheme={colorScheme}
      styleNonce={styleNonce}
      keepAspectRatio={keepAspectRatio ? bounds : false}
      className={cx(
        'likec4-view',
        className,
      )}
      style={style}>
      <LikeC4Diagram
        view={view}
        enableNotations={hasNotations}
        {...props}
      />
    </ShadowRoot>
  )
}
