import type { DiagramView, WhereOperator } from '@likec4/core'
import { type CSSProperties } from 'react'
import { ShadowRoot } from './ShadowRoot'

import { cx } from '@likec4/styles/css'
import { isFunction, isString } from 'remeda'
import { type LikeC4DiagramProps, LikeC4Diagram } from '../LikeC4Diagram'
import type { OnNavigateTo } from '../LikeC4Diagram.props'
import { useLikeC4Model } from '../likec4model/useLikeC4Model'
import { useColorScheme, useShadowRootStyle } from './styles.css'
import { ErrorMessage, ViewNotFound } from './ViewNotFound'

export type ReactLikeC4Props<
  ViewId = string,
  Tag = string,
  Kind = string,
> = Omit<LikeC4DiagramProps, 'view' | 'where' | 'onNavigateTo'> & {
  viewId: ViewId

  /**
   * Keep aspect ratio of the diagram
   * Disable if you need to manage the viewport (use className)
   *
   * @default true
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

  where?: WhereOperator<Tag, Kind> | undefined

  onNavigateTo?: OnNavigateTo<ViewId> | undefined

  mantineTheme?: any

  /** Function to generate nonce attribute added to all generated `<style />` tags */
  styleNonce?: string | (() => string) | undefined
}

export function ReactLikeC4<
  ViewId extends string = string,
  Tag = string,
  Kind = string,
>({
  viewId,
  ...props
}: ReactLikeC4Props<ViewId, Tag, Kind>) {
  const likec4model = useLikeC4Model()
  const view = likec4model?.findView(viewId)

  if (!likec4model) {
    return (
      <ErrorMessage>
        LikeC4Model not found. Make sure you have LikeC4ModelProvider.
      </ErrorMessage>
    )
  }

  if (!view) {
    return <ViewNotFound viewId={viewId} />
  }

  if (!view.isDiagram()) {
    return (
      <ErrorMessage>
        LikeC4Model is not layouted. Make sure you have LikeC4ModelProvider with layouted model.
      </ErrorMessage>
    )
  }

  return <ReactLikeC4Inner view={view.$view} {...props} />
}

type ReactLikeC4InnerProps = Omit<ReactLikeC4Props<any, any, any>, 'viewId'> & {
  view: DiagramView
}
function ReactLikeC4Inner({
  className,
  view,
  colorScheme: explicitColorScheme,
  injectFontCss = true,
  keepAspectRatio = true,
  showNotations = true,
  onNavigateTo,
  background = 'transparent',
  style,
  mantineTheme,
  styleNonce,
  ...props
}: ReactLikeC4InnerProps) {
  const colorScheme = useColorScheme(explicitColorScheme)

  const [shadowRootProps, cssstyle] = useShadowRootStyle(keepAspectRatio, view)

  const notations = view.notation?.elements ?? []
  const hasNotations = notations.length > 0

  let nonce
  if (isString(styleNonce)) {
    nonce = styleNonce
  } else if (isFunction(styleNonce)) {
    nonce = styleNonce()
  }

  return (
    <>
      <style
        type="text/css"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: cssstyle }}
      />
      <ShadowRoot
        {...shadowRootProps}
        injectFontCss={injectFontCss}
        theme={mantineTheme}
        colorScheme={colorScheme}
        styleNonce={styleNonce}
        className={cx(
          'likec4-view',
          className,
        )}
        style={style}>
        <LikeC4Diagram
          view={view as any}
          showNotations={showNotations && hasNotations}
          onNavigateTo={onNavigateTo as any}
          background={background}
          {...props}
        />
      </ShadowRoot>
    </>
  )
}
ReactLikeC4.displayName = 'GenericReactLikeC4'
