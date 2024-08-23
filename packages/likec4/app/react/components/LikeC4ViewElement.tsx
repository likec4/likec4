import { LikeC4Diagram } from '@likec4/diagram'
import clsx from 'clsx'
import { type HTMLAttributes, type ReactNode, useId } from 'react'
import { ShadowRoot } from './ShadowRoot'

import { useCallbackRef } from '@mantine/hooks'
import { ShadowRootMantineProvider } from './ShadowRootMantineProvider'
import { cssInteractive, cssLikeC4View } from './styles.css'
import type { DiagramView, ElementIconRenderer } from './types'
import type { WhereOperator } from './types-filter'

export type LikeC4ViewElementProps<ViewId extends string, Tag extends string, Kind extends string> =
  & Omit<HTMLAttributes<HTMLDivElement>, 'children'>
  & {
    view: DiagramView<ViewId>

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

    showElementLinks?: boolean | undefined

    enableFocusMode?: boolean | undefined

    where?: WhereOperator<Tag, Kind> | undefined
  }

export function LikeC4ViewElement<ViewId extends string, Tag extends string, Kind extends string>({
  onNavigateTo: _onNavigateTo,
  className,
  view,
  injectFontCss,
  colorScheme,
  background = 'transparent',
  renderIcon,
  showElementLinks = true,
  enableFocusMode = true,
  where,
  ...props
}: LikeC4ViewElementProps<ViewId, Tag, Kind>) {
  const id = useId()

  const isLandscape = view.bounds.width > view.bounds.height

  const onNavigateTo = useCallbackRef((to: string) => {
    _onNavigateTo?.(to as ViewId)
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
    aspect-ratio: ${Math.ceil(view.bounds.width)} / ${Math.ceil(view.bounds.height)};
    max-height: var(--likec4-view-max-height, ${Math.ceil(view.bounds.height)}px);
  }
      `
        }} />
      <ShadowRoot
        data-likec4-instance={id}
        injectFontCss={injectFontCss}
        className={clsx('likec4-view', className)}
        {...props}
        {...(_onNavigateTo && {
          onClick: (e) => {
            e.stopPropagation()
            onNavigateTo(view.id)
          }
        })}
      >
        <ShadowRootMantineProvider
          colorScheme={colorScheme}
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
            showDiagramTitle={false}
            enableDynamicViewWalkthrough={false}
            showNavigationButtons={false}
            experimentalEdgeEditing={false}
            enableFocusMode={enableFocusMode}
            controls={false}
            nodesSelectable={false}
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
