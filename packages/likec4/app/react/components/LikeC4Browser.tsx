import type { WhereOperator } from '@likec4/core'
import { LikeC4Diagram } from '@likec4/diagram'
import { ActionIcon, type MantineThemeOverride } from '@mantine/core'
import { useMountEffect } from '@react-hookz/web'
import { IconX } from '@tabler/icons-react'
import { type HTMLAttributes, useId, useRef, useState } from 'react'
import { closeButton, cssDiagram } from './LikeC4Browser.css'
import { ShadowRoot } from './ShadowRoot'
import { ShadowRootMantineProvider } from './ShadowRootMantineProvider'
import * as css from './styles.css'
import type { ElementIconRenderer, ViewData } from './types'

export type LikeC4BrowserProps<ViewId extends string, Tag extends string, Kind extends string> =
  & Pick<HTMLAttributes<HTMLDialogElement>, 'style' | 'className'>
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
     * @default 'dots'
     */
    background?: 'dots' | 'lines' | 'cross' | 'transparent' | 'solid' | undefined

    onNavigateTo: (to: ViewId) => void
    onClose: () => void

    /**
     * Render custom icon for a node
     * By default, if icon is http:// or https://, it will be rendered as an image
     */
    renderIcon?: ElementIconRenderer | undefined

    where?: WhereOperator<Tag, Kind> | undefined

    mantineTheme?: MantineThemeOverride | undefined
  }

export function LikeC4Browser<
  ViewId extends string = string,
  Tag extends string = string,
  Kind extends string = string
>({
  className,
  colorScheme,
  view,
  injectFontCss,
  onNavigateTo,
  onClose,
  renderIcon,
  where,
  style,
  mantineTheme,
  background = 'dots'
}: LikeC4BrowserProps<ViewId, Tag, Kind>) {
  const [opened, setOpened] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const id = useId()

  useMountEffect(() => {
    dialogRef.current?.showModal()
    setTimeout(() => {
      setOpened(true)
    }, 50)
  })
  const closeMe = () => {
    setTimeout(() => {
      onClose()
    }, 400)
  }

  const backdropRgb = colorScheme === 'dark' ? '36 36 36' : '255 255 255'

  const notations = view.notation?.elements ?? []
  const hasNotations = notations.length > 0

  return (
    <>
      <style
        type="text/css"
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes likec4-dialog-fade-in {
          0% {
            opacity: 0;
            transform: scale(0.7);
            display: none;
          }
          100% {
            opacity: 1;
            transform: scale(1);
            display: block;
          }
        }
        @keyframes likec4-dialog-fade-out {
          0% {
            opacity: 1;
            transform: scale(1);
            display: block;
          }

          100% {
            opacity: 0;
            transform: scale(0.9);
            display: none;
          }
        }
        @keyframes likec4-dialog-backdrop-fade-in {
          0% {
            -webkit-backdrop-filter: blur(1px);
            backdrop-filter: blur(1px);
            background-color: rgb(${backdropRgb} / 30%);
          }
          100% {
            -webkit-backdrop-filter: blur(8px);
            backdrop-filter: blur(8px);
            background-color: rgb(${backdropRgb} / ${colorScheme === 'dark' ? '85' : '75'}%);
          }
        }
        [data-likec4-instance="${id}"] {
          top: 0;
          left: 0;
          border: 0 solid transparent;
          box-sizing: border-box;
          width: 100%;
          min-width: 100dvw;
          height: 100%;
          min-height: 100dvh;
          background: transparent;
          animation: likec4-dialog-fade-out 0.15s ease-out;
          transform-origin: 50% 20%;
        }
        [data-likec4-instance="${id}"][open] {
          animation: likec4-dialog-fade-in 0.3s ease-out;
        }
        [data-likec4-instance="${id}"] > div {
          width: 100%;
          height: 100%;
          padding: 0;
          margin: 0;
          border: 0 solid transparent;
          box-sizing: border-box;
        }
        [data-likec4-instance="${id}"]::backdrop {
          -webkit-backdrop-filter: blur(1px);
          backdrop-filter: blur(1px);
          background-color: rgb(${backdropRgb} / 30%);
        }
        [data-likec4-instance="${id}"][open]::backdrop {
          animation: likec4-dialog-backdrop-fade-in 450ms ease-out forwards;
        }
      `
        }} />
      <dialog
        aria-modal="true"
        data-likec4-instance={id}
        ref={dialogRef}
        style={{
          margin: 0,
          padding: 0,
          border: '0 solid transparent',
          ...style
        }}
        className={className}
        onClose={closeMe}>
        <ShadowRoot injectFontCss={injectFontCss}>
          <ShadowRootMantineProvider
            theme={mantineTheme}
            colorScheme={colorScheme}
            className={css.cssLikeC4Browser}
          >
            {opened && (
              <LikeC4Diagram
                className={cssDiagram}
                view={view as any}
                readonly
                pannable
                zoomable
                fitView
                fitViewPadding={0.05}
                showDiagramTitle
                showElementLinks
                enableDynamicViewWalkthrough
                enableFocusMode
                showNavigationButtons
                showRelationshipDetails
                showNotations={hasNotations}
                background={background}
                controls={false}
                nodesSelectable={false}
                nodesDraggable={false}
                keepAspectRatio={false}
                renderIcon={renderIcon}
                where={where}
                // @ts-expect-error string cast to ViewId
                onNavigateTo={onNavigateTo}
              />
            )}
            <ActionIcon
              className={closeButton}
              variant="light"
              color="gray"
              autoFocus
              onClick={(e) => {
                e.stopPropagation()
                dialogRef.current?.close()
              }}>
              <IconX />
            </ActionIcon>
          </ShadowRootMantineProvider>
        </ShadowRoot>
      </dialog>
    </>
  )
}
