import { LikeC4Diagram } from '@likec4/diagram'
import clsx from 'clsx'
import { type HTMLAttributes, useId } from 'react'
import { ShadowRoot } from './ShadowRoot'
import { useColorScheme } from './styles'

import { useCallbackRef } from '@mantine/hooks'
import { ShadowRootMantineProvider } from './ShadowRootMantineProvider'
import { cssInteractive, cssLikeC4View } from './styles.css'
import type { DiagramView } from './types'

export type LikeC4ViewElementProps<ViewId extends string> = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  view: DiagramView<ViewId>

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
   * Background pattern
   * @default 'transparent'
   */
  background?: 'dots' | 'lines' | 'cross' | 'transparent' | 'solid' | undefined

  onNavigateTo?: ((to: ViewId) => void) | undefined
}

export function LikeC4ViewElement<ViewId extends string>({
  onNavigateTo,
  className,
  view,
  injectFontCss,
  colorScheme,
  background = 'transparent',
  ...props
}: LikeC4ViewElementProps<ViewId>) {
  const id = useId()
  const scheme = useColorScheme(colorScheme)

  const isLandscape = view.width > view.height

  const onNavigateToCb = useCallbackRef((to: string) => {
    onNavigateTo?.(to as ViewId)
  })

  return (
    <>
      <style
        type="text/css"
        dangerouslySetInnerHTML={{
          __html: `
  [data-likec4-instance="${id}"] {
    box-sizing: border-box;
    border: 0 solid transparent;
    padding: 0;
    ${
            isLandscape ? '' : `
    margin-left: auto;
    margin-right: auto;`
          }
    width: ${isLandscape ? '100%' : 'auto'};
    width: -webkit-fill-available;
    height: ${isLandscape ? 'auto' : '100%'};
    height: -webkit-fill-available;
    ${
            isLandscape ? '' : `
    min-height: 100px;`
          }
    aspect-ratio: ${Math.ceil(view.width)} / ${Math.ceil(view.height)};
    max-height: var(--likec4-view-max-height, ${Math.ceil(view.height)}px);
  }
      `
        }} />
      <ShadowRoot
        data-likec4-instance={id}
        injectFontCss={injectFontCss}
        className={clsx('likec4-view', className)}
        {...props}
        {...(onNavigateTo && {
          onClick: (e) => {
            e.stopPropagation()
            onNavigateTo(view.id)
          }
        })}
      >
        <ShadowRootMantineProvider
          colorScheme={scheme}
          className={clsx(cssLikeC4View, !!onNavigateTo && cssInteractive)}
        >
          <LikeC4Diagram
            view={view as any}
            readonly
            pannable={false}
            zoomable={false}
            background={background}
            fitView
            fitViewPadding={0}
            showElementLinks
            showDiagramTitle={false}
            enableDynamicViewWalkthrough={false}
            showNavigationButtons={false}
            controls={false}
            nodesSelectable={false}
            keepAspectRatio={false}
            {...(onNavigateTo && {
              onNavigateTo: onNavigateToCb
            })}
          />
        </ShadowRootMantineProvider>
      </ShadowRoot>
    </>
  )
}
