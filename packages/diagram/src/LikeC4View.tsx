import type * as t from '@likec4/core/types'
import { css, cx } from '@likec4/styles/css'
import { ActionIcon, Box } from '@mantine/core'
import { useCallbackRef } from '@mantine/hooks'
import { IconX } from '@tabler/icons-react'
import type { CSSProperties } from 'react'
import { useState } from 'react'
import { isBoolean } from 'remeda'
import { FitViewPaddings } from './base/const'
import { ErrorMessage, ViewNotFound } from './components/ViewNotFound'
import { FramerMotionConfig } from './context/FramerMotionConfig'
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
   * @default '8px'
   *
   * @see {@link ViewPadding}
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
  showNotations?: boolean | undefined

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
  showNotations?: boolean | undefined

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
  showNotations,
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
  ...props
}: LikeC4ViewProps<A>) {
  const likec4model = useOptionalLikeC4Model()
  const [browserViewId, onNavigateTo] = useState(null as t.aux.ViewId<t.aux.UnknownLayouted> | null)
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

  const browserView = browserViewId ? likec4model.findView(browserViewId)?.$view : null

  const notations = view.notation?.nodes ?? []
  const hasNotations = notations.length > 0
  showNotations ??= hasNotations

  const isBrowserEnabled = browser !== false

  const browserProps = isBoolean(browser) ? {} : browser

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
      <FramerMotionConfig>
        <LikeC4Diagram
          view={view}
          readonly
          pannable={pannable}
          zoomable={zoomable}
          background={background}
          fitView={true}
          fitViewPadding={FitViewPaddings.default}
          showNotations={showNotations}
          enableDynamicViewWalkthrough={enableDynamicViewWalkthrough}
          showNavigationButtons={showNavigationButtons}
          experimentalEdgeEditing={false}
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
              controls
              readonly
              fitView
              {...props}
              fitViewPadding={FitViewPaddings.withControls}
              {...browserProps}
              showNotations={browserProps.showNotations ?? showNotations}
              renderNodes={renderNodes}
            />
            <Box pos="absolute" top={'1rem'} right={'1rem'}>
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
