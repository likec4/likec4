import type { HTMLAttributes, ReactNode } from 'react'
import type { WhereOperator } from './types-filter'

export type DiagramView<ViewId extends string> = {
  id: ViewId
  bounds: {
    width: number
    height: number
  }
}

export type ElementIconRendererProps = {
  node: {
    id: string
    title: string
    icon?: string | undefined
  }
}

export type ElementIconRenderer = (props: ElementIconRendererProps) => ReactNode

export type LikeC4ViewBaseProps<ViewId extends string, Tag extends string, Kind extends string> =
  & Omit<HTMLAttributes<HTMLDivElement>, 'children'>
  & {
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

    where?: WhereOperator<Tag, Kind> | undefined
  }
