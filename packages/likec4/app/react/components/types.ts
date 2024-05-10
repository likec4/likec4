import type { HTMLAttributes } from 'react'

export type DiagramView<ViewId extends string> = {
  id: ViewId
  width: number
  height: number
}

export type LikeC4ViewBaseProps<ViewId extends string> = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  viewId: ViewId

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
}
