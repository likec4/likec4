import '@mantine/core/styles.css'
import '@xyflow/react/dist/style.css'

import { LikeC4Diagram } from '@likec4/diagram'
import clsx from 'clsx'
import { useId } from 'react'
import { ShadowRoot } from './ShadowRoot'
import { useColorScheme } from './styles'
import { cssInteractive, cssLikeC4View } from './styles.css'
import type { DiagramView, LikeC4ViewBaseProps } from './types'

export type LikeC4ViewElementProps<ViewId extends string> =
  & Omit<LikeC4ViewBaseProps<ViewId>, 'viewId' | 'interactive'>
  & {
    view: DiagramView<ViewId>
    onNavigateTo?: ((to: ViewId) => void) | undefined
  }

export function LikeC4ViewElement<ViewId extends string>({
  onNavigateTo,
  view,
  injectFontCss,
  colorScheme,
  ...props
}: LikeC4ViewElementProps<ViewId>) {
  const id = useId()
  const scheme = useColorScheme(colorScheme)

  return (
    <>
      <style
        type="text/css"
        dangerouslySetInnerHTML={{
          __html: `
        [data-likec4-instance="${id}"] {
          box-sizing: border-box;
          padding: 0;
          width: 100%;
          height: auto;
          aspect-ratio: ${Math.ceil(view.width)} / ${Math.ceil(view.height)};
          max-height: ${Math.ceil(view.height)}px;
        }
      `
        }} />
      <ShadowRoot
        colorScheme={scheme}
        data-likec4-instance={id}
        injectFontCss={injectFontCss}
        rootClassName={clsx(cssLikeC4View, !!onNavigateTo && cssInteractive)}
        {...props}
        {...(onNavigateTo && {
          onClick: (e) => {
            e.stopPropagation()
            onNavigateTo(view.id)
          }
        })}
      >
        <LikeC4Diagram
          view={view as any}
          readonly
          pannable={false}
          zoomable={false}
          background={'transparent'}
          fitView
          fitViewPadding={0.02}
          showElementLinks
          controls={false}
          nodesSelectable={false}
          keepAspectRatio={false}
          {...(onNavigateTo && {
            onNodeClick: ({ event }) => {
              event.stopPropagation()
              onNavigateTo(view.id)
            },
            onNavigateTo: to => onNavigateTo(to as string as ViewId)
          })}
        />
      </ShadowRoot>
    </>
  )
}