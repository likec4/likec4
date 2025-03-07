import type { WhereOperator } from '@likec4/core'
import type { ElementIconRenderer } from '@likec4/diagram'
import type { CSSProperties } from 'react'

export interface LikeC4ViewProps<ViewId = string, Tag = string, Kind = string> {
  /**
   * View to display.
   */
  viewId: ViewId

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
   * Seems like this is percentage of the view size
   * @default 0.1
   */
  fitViewPadding?: number | undefined

  /**
   * Display diagram title / description
   *
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
   * If double click on a node should enable focus mode, i.e. highlight incoming/outgoing edges
   * Conflicts with `browser` prop
   *
   * @default false
   */
  enableFocusMode?: boolean | undefined

  /**
   * If Walkthrough for dynamic views should be enabled
   * @default enableFocusMode
   */
  enableDynamicViewWalkthrough?: boolean | undefined

  /**
   * Enable popup with element details
   * @default false
   */
  enableElementDetails?: boolean | undefined

  /**
   * Experimental feature to browse relationships
   *
   * @default enableElementDetails
   */
  enableRelationshipBrowser?: boolean | undefined

  /**
   * Display dropdown with details on relationship's label click
   * @default enableRelationshipBrowser
   */
  enableRelationshipDetails?: boolean | undefined

  /**
   * Improve performance by hiding certain elements and reducing visual effects (disable mix-blend, shadows, animations)
   *
   * @default 'auto' - will be set to true if view is pannable and has more than 3000 * 2000 pixels
   */
  reduceGraphics?: 'auto' | boolean | undefined

  where?: WhereOperator<Tag, Kind> | undefined

  className?: string | undefined
  style?: CSSProperties | undefined

  /**
   * Override Mantine theme
   */
  mantineTheme?: any

  /** Function to generate nonce attribute added to all generated `<style />` tags */
  styleNonce?: string | (() => string) | undefined

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
   * Seems like this is percentage of the view size
   * @default 0.1
   */
  fitViewPadding?: number | undefined

  /**
   * Show/hide panel with top left controls,
   * @default true
   */
  controls?: boolean | undefined

  /**
   * Display diagram title / description
   *
   * @default true
   */
  showDiagramTitle?: boolean | undefined

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
   * Enable popup with element details
   * @default true
   */
  enableElementDetails?: boolean | undefined

  /**
   * Experimental feature to browse relationships
   *
   * @default enableElementDetails
   */
  enableRelationshipBrowser?: boolean | undefined

  /**
   * Display dropdown with details on relationship's label click
   * @default enableRelationshipBrowser
   */
  enableRelationshipDetails?: boolean | undefined

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
}
