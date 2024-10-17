import { LikeC4Diagram } from '@likec4/diagram'
import clsx from 'clsx'
import { type HTMLAttributes } from 'react'
import { ShadowRoot } from './ShadowRoot'

import type { WhereOperator } from '@likec4/core'
import type { MantineThemeOverride } from '@mantine/core'
import { useCallbackRef } from '@mantine/hooks'
import { ShadowRootMantineProvider } from './ShadowRootMantineProvider'
import { useShadowRootStyle } from './style'
import { cssInteractive, cssLikeC4View } from './styles.css'
import type { ElementIconRenderer, ViewData } from './types'

export type LikeC4ViewEmbeddedProps<ViewId extends string, Tag extends string, Kind extends string> =
  & Pick<HTMLAttributes<HTMLDivElement>, 'style' | 'className'>
  & {
    view: ViewData<ViewId>

    /**
     * By default determined by the user's system preferences.
     */
    colorScheme?: 'light' | 'dark'

    /**
     * LikeC4 views are using 'IBM Plex Sans' font.
     * By default, component injects the CSS to document head.
     * Set to false if you want to handle the font yourself.
     *
     * @default true
     */
    injectFontCss?: boolean | undefined

    /**
     * Background pattern
     * @default 'transparent'
     */
    background?: 'dots' | 'lines' | 'cross' | 'transparent' | 'solid' | undefined

    onNavigateTo?: ((to: ViewId) => void) | undefined

    /**
     * Render custom icon for a node
     * By default, if icon is http:// or https://, it will be rendered as an image
     */
    renderIcon?: ElementIconRenderer | undefined

    /**
     * Display hovercards with element links
     * @default true
     */
    showElementLinks?: boolean | undefined

    /**
     * Display webview with diagram title / description
     * @default false
     */
    showDiagramTitle?: boolean | undefined

    /**
     * Show back/forward navigation buttons
     * @default false
     */
    showNavigationButtons?: undefined | boolean

    /**
     * Display notations of the view
     * @default false
     */
    showNotations?: boolean | undefined

    /**
     * Display dropdown with details on relationship's label click
     * @default false
     */
    showRelationshipDetails?: boolean | undefined

    /**
     * If double click on a node should enable focus mode, i.e. highlight incoming/outgoing edges
     * @default false
     */
    enableFocusMode?: boolean | undefined

    where?: WhereOperator<Tag, Kind> | undefined

    mantineTheme?: MantineThemeOverride | undefined

    /** Function to generate nonce attribute added to all generated `<style />` tags */
    styleNonce?: string | (() => string) | undefined

    /**
     * Experimental feature to browse relationships
     *
     * @default false
     */
    enableRelationshipsBrowser?: boolean | undefined
  }

export function LikeC4ViewEmbedded<
  ViewId extends string = string,
  Tag extends string = string,
  Kind extends string = string
>({
  onNavigateTo: _onNavigateTo,
  className,
  view,
  injectFontCss,
  colorScheme,
  background = 'transparent',
  renderIcon,
  showDiagramTitle = false,
  showElementLinks = true,
  showNavigationButtons = false,
  enableFocusMode = false,
  showNotations = false,
  showRelationshipDetails = false,
  enableRelationshipsBrowser = false,
  mantineTheme,
  where,
  style,
  styleNonce
}: LikeC4ViewEmbeddedProps<ViewId, Tag, Kind>) {
  const [shadowRootProps, cssstyle] = useShadowRootStyle(true, view)

  const onNavigateTo = useCallbackRef((to: string) => {
    _onNavigateTo?.(to as ViewId)
  })

  const notations = view.notation?.elements ?? []
  const hasNotations = notations.length > 0

  let nonce
  if (typeof styleNonce === 'string') {
    nonce = styleNonce
  } else if (typeof styleNonce === 'function') {
    nonce = styleNonce()
  }

  return (
    <>
      <style
        type="text/css"
        nonce={nonce}
        dangerouslySetInnerHTML={{
          __html: cssstyle
        }} />
      <ShadowRoot
        {...shadowRootProps}
        injectFontCss={injectFontCss}
        className={clsx('likec4-view', className)}
        style={style}
        {...(_onNavigateTo && {
          onClick: (e) => {
            e.stopPropagation()
            onNavigateTo(view.id)
          }
        })}
      >
        <ShadowRootMantineProvider
          theme={mantineTheme}
          colorScheme={colorScheme}
          styleNonce={styleNonce}
          className={clsx(cssLikeC4View, !!_onNavigateTo && cssInteractive)}
        >
          <LikeC4Diagram
            view={view as any}
            readonly
            pannable={false}
            zoomable={false}
            background={background}
            fitView
            fitViewPadding={0}
            showElementLinks={showElementLinks}
            showDiagramTitle={showDiagramTitle}
            showNotations={showNotations && hasNotations}
            enableDynamicViewWalkthrough={enableFocusMode}
            showNavigationButtons={showNavigationButtons}
            experimentalEdgeEditing={false}
            enableFocusMode={enableFocusMode}
            showRelationshipDetails={showRelationshipDetails}
            enableRelationshipsBrowser={enableRelationshipsBrowser}
            controls={false}
            nodesSelectable={false}
            nodesDraggable={false}
            keepAspectRatio={false}
            renderIcon={renderIcon}
            where={where}
            {...(_onNavigateTo && {
              onNavigateTo
            })}
          />
        </ShadowRootMantineProvider>
      </ShadowRoot>
    </>
  )
}
