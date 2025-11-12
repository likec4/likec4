import type * as t from '@likec4/core/types'
import type { LayoutType } from '@likec4/core/types'
import { css, cx } from '@likec4/styles/css'
import { Box } from '@likec4/styles/jsx'
import { ActionIcon } from '@mantine/core'
import { IconX } from '@tabler/icons-react'
import type { CSSProperties, ReactNode } from 'react'
import { useState } from 'react'
import { isBoolean } from 'remeda'
import { FitViewPaddings } from './base/const'
import { ErrorMessage, ViewNotFound } from './components/ViewNotFound'
import { FramerMotionConfig } from './context/FramerMotionConfig'
import { useCallbackRef } from './hooks/useCallbackRef'
import { useOptionalLikeC4Model } from './hooks/useLikeC4Model'
import { LikeC4Diagram } from './LikeC4Diagram'
import type {
  ElementIconRenderer,
  NodeRenderers,
  OverrideReactFlowProps,
  PaddingWithUnit,
  ViewPadding,
} from './LikeC4Diagram.props'
import { Overlay } from './overlays/overlay/Overlay'
import { ShadowRoot } from './shadowroot/ShadowRoot'
import { pickViewBounds } from './utils/view-bounds'

export interface LikeC4ViewProps<A extends t.aux.Any = t.aux.UnknownLayouted> {
  /**
   * View to display.
   */
  viewId: t.aux.ViewId<A>

  /**
   * Enable/disable panning
   * @default false
   */
  pannable?: boolean | undefined

  /**
   * Enable/disable zooming
   * @default false
   */
  zoomable?: boolean | undefined

  /**
   * @default true
   */
  keepAspectRatio?: boolean | undefined

  /**
   * Background pattern
   * @default 'transparent'
   */
  background?: 'dots' | 'lines' | 'cross' | 'transparent' | 'solid' | undefined

  /**
   * Click on the view opens a modal with browser.
   * You can customize or disable the browser.
   *
   * @default true
   */
  browser?: boolean | LikeC4BrowserProps | undefined

  /**
   * @default - determined by the user's system preferences.
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

  /**
   * Show/hide panel with top left controls,
   * @default false
   */
  controls?: boolean | undefined

  /**
   * If set, initial viewport will show all nodes & edges
   * @default true
   */
  fitView?: boolean | undefined

  /**
   * Padding around the diagram
   * @default '16px'
   *
   * @see {@link ViewPadding}
   *
   * @example
   * ```tsx
   * <LikeC4View
   *   fitViewPadding={{
   *     x: '16px',
   *     y: 16,
   *   }}
   * />
   *
   * <LikeC4View
   *   fitViewPadding={{
   *     top: 8,
   *     right: '8px',
   *     bottom: '1px',
   *     left: '8px',
   *   }}
   * />
   * ```
   */
  fitViewPadding?: ViewPadding | undefined

  /**
   * Show back/forward navigation buttons in controls panel
   * @default false
   */
  showNavigationButtons?: undefined | boolean

  /**
   * Display notations of the view
   * @default false
   */
  enableNotations?: boolean | undefined

  /**
   * If double click on a node should enable focus mode, i.e. highlight incoming/outgoing edges
   * Conflicts with `browser` prop
   *
   * @default false
   */
  enableFocusMode?: boolean | undefined

  /**
   * If Walkthrough for dynamic views should be enabled
   * @default false
   */
  enableDynamicViewWalkthrough?: boolean | undefined

  /**
   * Default dynamic view display variant
   * @default 'diagram'
   */
  dynamicViewVariant?: t.DynamicViewDisplayVariant | undefined

  /**
   * Enable popup with element details
   * @default false
   */
  enableElementDetails?: boolean | undefined

  /**
   * Display element tags in the bottom left corner
   * @default false
   */
  enableElementTags?: boolean | undefined

  /**
   * Display dropdown with details on relationship's label click
   * @default false
   */
  enableRelationshipDetails?: boolean | undefined

  /**
   * Allow popup to browse relationships
   *
   * @default enableRelationshipDetails
   */
  enableRelationshipBrowser?: boolean | undefined

  /**
   * Improve performance by hiding certain elements and reducing visual effects (disable mix-blend, shadows, animations)
   *
   * @default 'auto' - will be set to true if view is pannable and has more than 3000 * 2000 pixels
   */
  reduceGraphics?: 'auto' | boolean | undefined

  where?: t.WhereOperator<A> | undefined

  /**
   * Override some react flow props
   */
  reactFlowProps?: OverrideReactFlowProps | undefined

  className?: string | undefined
  style?: CSSProperties | undefined

  /**
   * Override Mantine theme
   */
  mantineTheme?: any

  /** Function to generate nonce attribute added to all generated `<style />` tags */
  styleNonce?: string | (() => string) | undefined

  /**
   * Override node renderers
   */
  renderNodes?: NodeRenderers | undefined

  /**
   * Render custom icon for a node
   * By default, if icon is http:// or https://, it will be rendered as an image
   */
  renderIcon?: ElementIconRenderer | undefined

  /**
   * Children to render inside the diagram (not inside the browser overlay)
   */
  children?: ReactNode | undefined
}

export interface LikeC4BrowserProps {
  /**
   * Background pattern for the browser view.
   * @default 'dots'
   */
  background?: 'dots' | 'lines' | 'cross' | 'transparent' | 'solid' | undefined

  /**
   * Padding around the diagram
   * @default '16px'
   */
  fitViewPadding?: PaddingWithUnit | undefined

  /**
   * Show/hide panel with top left controls,
   *
   * @default true
   */
  controls?: boolean | undefined

  /**
   * Show back/forward navigation buttons
   * @default true
   */
  showNavigationButtons?: undefined | boolean

  /**
   * Enable search popup for elements and views
   * @default true
   */
  enableSearch?: boolean | undefined

  /**
   * If double click on a node should enable focus mode
   *
   * @default true
   */
  enableFocusMode?: boolean | undefined

  /**
   * If Walkthrough for dynamic views should be enabled
   * @default true
   */
  enableDynamicViewWalkthrough?: boolean | undefined

  /**
   * Default dynamic view display variant
   * @default 'diagram'
   */
  dynamicViewVariant?: t.DynamicViewDisplayVariant | undefined

  /**
   * Enable popup with element details
   * @default true
   */
  enableElementDetails?: boolean | undefined

  /**
   * Experimental feature to browse relationships
   *
   * @default true
   */
  enableRelationshipBrowser?: boolean | undefined

  /**
   * Display dropdown with details on relationship's label click
   * @default enableRelationshipBrowser
   */
  enableRelationshipDetails?: boolean | undefined

  /**
   * Display element tags in the bottom left corner
   * @default true
   */
  enableElementTags?: boolean | undefined

  /**
   * Display notations of the view
   * @default true
   */
  enableNotations?: boolean | undefined

  /**
   * Enable "Compare with auto layout" action when view was manually modified and out of sync with latest model
   * @default true
   */
  enableCompareWithLatest?: boolean | undefined

  /**
   * Improve performance by hiding certain elements and reducing visual effects (disable mix-blend, shadows, animations)
   *
   * @default 'auto' - will be set to true if view is pannable and has more than 3000 * 2000 pixels
   */
  reduceGraphics?: 'auto' | boolean | undefined

  className?: string | undefined

  style?: CSSProperties | undefined

  /**
   * Override some react flow props
   */
  reactFlowProps?: OverrideReactFlowProps | undefined

  /**
   * Children to render inside the browser overlay
   */
  children?: ReactNode | undefined
}

const cssInteractive = css({
  cursor: 'pointer',
  ['--mantine-cursor-pointer']: 'pointer',
  '& :where(.likec4-diagram, .likec4-compound-node, .likec4-element-node)': {
    cursor: 'pointer',
  },
})

/**
 * Ready-to-use component to display embedded LikeC4 view,
 * OnClick allows to browse the model.
 *
 * {@link ReactLikeC4} gives you more control.
 *
 * Component is wrapped in ShadowRoot to isolate styles.
 */
export function LikeC4View<A extends t.aux.Any = t.aux.UnknownLayouted>({
  viewId,
  className,
  pannable = false,
  zoomable = false,
  keepAspectRatio = true,
  colorScheme,
  injectFontCss = true,
  controls = false,
  background = 'transparent',
  browser = true,
  showNavigationButtons = false,
  enableNotations,
  enableFocusMode = false,
  enableDynamicViewWalkthrough = false,
  enableElementDetails = false,
  enableRelationshipDetails = false,
  enableRelationshipBrowser = enableRelationshipDetails,
  reduceGraphics = 'auto',
  mantineTheme,
  styleNonce,
  style,
  reactFlowProps,
  renderNodes,
  children,
  ...props
}: LikeC4ViewProps<A>) {
  const likec4model = useOptionalLikeC4Model()
  const [layoutType, setLayoutType] = useState<LayoutType>('manual')
  const [browserViewId, _onNavigateTo] = useState(null as t.aux.ViewId<t.aux.UnknownLayouted> | null)
  const onNavigateTo = useCallbackRef((viewId: t.aux.ViewId<t.aux.UnknownLayouted> | null) => {
    // reset layout type if we navigate to a different view
    if (viewId && viewId !== browserViewId) {
      setLayoutType('manual')
    }
    _onNavigateTo(viewId)
  })
  const onNavigateToThisView = useCallbackRef(() => {
    onNavigateTo(viewId)
  })

  if (!likec4model) {
    return (
      <ErrorMessage>
        LikeC4Model not found. Make sure you provided LikeC4ModelProvider.
      </ErrorMessage>
    )
  }

  const view = likec4model.findView(viewId)?.$layouted

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

  const browserViewModel = browserViewId ? likec4model.findView(browserViewId) : null
  const browserView = layoutType === 'manual' ? browserViewModel?.$layouted : browserViewModel?.$view

  const hasNotations = !!enableNotations && (view.notation?.nodes?.length ?? 0) > 0

  const browserViewHasNotations = (browserView?.notation?.nodes?.length ?? 0) > 0

  const isBrowserEnabled = browser !== false

  const browserProps = isBoolean(browser) ? {} : browser

  const bounds = pickViewBounds(view, props.dynamicViewVariant)

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
      <FramerMotionConfig>
        <LikeC4Diagram
          view={view}
          readonly
          pannable={pannable}
          zoomable={zoomable}
          background={background}
          fitView
          fitViewPadding={FitViewPaddings.default}
          enableNotations={hasNotations}
          enableDynamicViewWalkthrough={enableDynamicViewWalkthrough}
          showNavigationButtons={showNavigationButtons}
          enableCompareWithLatest={false}
          enableFocusMode={enableFocusMode}
          enableRelationshipDetails={enableRelationshipDetails}
          enableElementDetails={enableElementDetails}
          enableRelationshipBrowser={enableRelationshipBrowser}
          enableElementTags={false}
          controls={controls}
          nodesDraggable={false}
          reduceGraphics={reduceGraphics}
          className={cx(
            'likec4-static-view',
            isBrowserEnabled && cssInteractive,
          )}
          // We may have multiple embedded views on the same page
          // so we don't want enable search and hotkeys
          enableSearch={false}
          {...isBrowserEnabled && {
            onCanvasClick: onNavigateToThisView,
            onNodeClick: onNavigateToThisView,
          }}
          reactFlowProps={reactFlowProps}
          renderNodes={renderNodes}
          children={children}
          {...props}
        />
        {browserView && (
          <Overlay openDelay={0} onClose={() => onNavigateTo(null)}>
            <LikeC4Diagram
              view={browserView}
              pannable
              zoomable
              background="dots"
              onNavigateTo={onNavigateTo}
              showNavigationButtons
              enableDynamicViewWalkthrough
              enableFocusMode
              enableRelationshipBrowser
              enableElementDetails
              enableRelationshipDetails
              enableSearch
              enableElementTags
              enableCompareWithLatest
              controls
              readonly
              nodesDraggable={false}
              fitView
              {...props}
              fitViewPadding={FitViewPaddings.withControls}
              {...browserProps}
              enableNotations={browserViewHasNotations && (browserProps.enableNotations ?? true)}
              renderNodes={renderNodes}
              onLayoutTypeChange={setLayoutType}
            />
            <Box pos="absolute" top={'4'} right={'4'} zIndex={'999'}>
              <ActionIcon
                variant="default"
                color="gray"
                onClick={(e) => {
                  e.stopPropagation()
                  onNavigateTo(null)
                }}>
                <IconX />
              </ActionIcon>
            </Box>
          </Overlay>
        )}
      </FramerMotionConfig>
    </ShadowRoot>
  )
}
