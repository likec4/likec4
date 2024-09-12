import type { DiagramView, WhereOperator } from '@likec4/core'
import type { MantineThemeOverride } from '@mantine/core'
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'

export type ViewData<ViewId extends string> = Omit<DiagramView, 'id'> & {
  id: ViewId
}

type ElementIconRendererProps = {
  node: {
    id: string
    title: string
    icon?: string | undefined
  }
}

export type ElementIconRenderer = (props: ElementIconRendererProps) => ReactNode

export type LikeC4ViewProps<ViewId extends string, Tag extends string, Kind extends string> = {
  /**
   * View to display.
   */
  viewId: ViewId

  /**
   * Background pattern
   * @default 'transparent'
   */
  background?: 'dots' | 'lines' | 'cross' | 'transparent' | 'solid' | undefined

  /**
   * Background pattern for the browser view.
   * @default 'dots'
   */
  browserBackground?: 'dots' | 'lines' | 'cross' | 'transparent' | 'solid' | undefined

  /**
   * Click on the view opens a modal with browser.
   *
   * @default true
   */
  interactive?: boolean

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

  /**
   * Display hovercards with element links
   * @default true
   */
  showElementLinks?: boolean | undefined

  /**
   * Display panel with diagram title / description
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
   * Conflicts with `interactive`
   *
   * @default false
   */
  enableFocusMode?: boolean | undefined

  where?: WhereOperator<Tag, Kind> | undefined

  className?: string | undefined
  style?: CSSProperties | undefined

  browserClassName?: string | undefined
  browserStyle?: CSSProperties | undefined

  mantineTheme?: MantineThemeOverride | undefined
}
