import type * as t from '@likec4/core/types'
import { cx } from '@likec4/styles/css'
import type { CSSProperties, ReactNode } from 'react'
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
     * Layout to display
     * - `auto`: auto-layouted from the current sources
     * - `manual`: manually layouted (if available, falls back to `auto`)
     *
     * Uncontrolled initial value, use `onLayoutTypeChange` to control it.
     *
     * @default 'manual'
     */
    layoutType?: t.LayoutType | undefined

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
     * LikeC4 views are using 'IBM Plex Sans Variable' font.
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

    children?: ReactNode | undefined
  }
  & Omit<LikeC4DiagramProperties<A>, 'view'>
  & LikeC4DiagramEventHandlers<A>

/**
 * Ready-to-use component to display embedded LikeC4 view, same as {@link LikeC4View}
 * But provides more control over the diagram
 *
 * Component is wrapped in ShadowRoot to isolate styles.
 */
export function ReactLikeC4<A extends t.aux.Any = t.aux.UnknownLayouted>({
  viewId,
  layoutType: initialLayoutType = 'manual',
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
  const viewModel = likec4model.findView(viewId)

  if (!viewModel) {
    return <ViewNotFound viewId={viewId} />
  }

  if (!viewModel.isLayouted()) {
    return (
      <ErrorMessage>
        LikeC4 View "${viewId}" is not layouted. Make sure you have LikeC4ModelProvider with layouted model.
      </ErrorMessage>
    )
  }

  const view = initialLayoutType === 'manual'
    ? viewModel.$layouted
    : viewModel.$view

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
