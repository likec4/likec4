import type { RichTextNonEmpty, RichTextOrEmpty } from '@likec4/core/types'
import { css, cx } from '@likec4/styles/css'
import { Box, Txt } from '@likec4/styles/jsx'
import { token } from '@likec4/styles/tokens'
import { Button, Popover, PopoverDropdown, Text, usePopoverContext } from '@mantine/core'
import { useAtom } from '@xstate/store-react'
import { deepEqual, shallowEqual } from 'fast-equals'
import {
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type SyntheticEvent,
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
} from 'react'
import type { MarkdownProps } from '../../base-primitives/Markdown'
import { Markdown } from '../../base-primitives/Markdown'
import { useEnabledFeatures } from '../../context/DiagramFeatures'
import { IconRenderer } from '../../context/IconRenderer'
import { useOptionalLikeC4Model } from '../../context/LikeC4ModelContext'
import { useRootContainerRef } from '../../context/RootContainerContext'
import { useDiagramMarkdownRefActions } from '../../hooks/useDiagramMarkdownRefActions'
import { ViewIcon } from '../ViewIcon'
import {
  type MarkdownRefResolver,
  createMarkdownRefResolver,
  resolveMarkdownRefs,
} from './markdown-refs'
import { type Interactivity, useMarkdownRefsInteractivity } from './useMarkdownRefsInteractivity'

const refsStyles = css({
  '& :where([data-likec4-ref-state="link"])': {
    cursor: 'pointer',
    _focusVisible: {
      outline: '[2px solid var(--mantine-primary-color-filled)]',
      outlineOffset: '[1px]',
      borderRadius: 'xs',
    },
  },
  '& :where([data-likec4-ref-state="missing"])': {
    opacity: '0.6',
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
    textUnderlineOffset: '2px',
  },
})

export const MarkdownWithRefs = memo<Omit<MarkdownProps, 'value'> & { value: RichTextOrEmpty }>((props) => {
  const value = props.value
  if (value.isEmpty || !value.isMarkdown) {
    return <Markdown {...props} />
  }
  return <GuardedMarkdown {...props} value={value} />
}, ({ value: prevValue, ...prev }, { value: nextValue, ...next }) => {
  return prevValue.equals(nextValue) && shallowEqual(prev, next)
})
MarkdownWithRefs.displayName = 'MarkdownWithRefs'

function GuardedMarkdown({ value, ...props }: Omit<MarkdownProps, 'value'> & { value: RichTextNonEmpty }) {
  const model = useOptionalLikeC4Model()
  const {
    enableElementDetails: canOpenElement,
    enableNavigateTo: canOpenView,
  } = useEnabledFeatures()

  const resolver = useMemo(
    () => createMarkdownRefResolver(model, { elements: canOpenElement, views: canOpenView }),
    [model, canOpenElement, canOpenView],
  )

  const originalHtml = value.html
  const resolvedValue = useMemo(
    () => ({ html: resolveMarkdownRefs(originalHtml, resolver) }),
    [originalHtml, resolver],
  )

  const hasRefs = resolvedValue.html.includes('data-likec4-ref')

  if (!hasRefs) {
    return <Markdown {...props} value={resolvedValue} />
  }
  return <MarkdownWithExistingRefs {...props} value={resolvedValue} resolver={resolver} />
}

function MarkdownWithExistingRefs(
  { className, resolver, ...props }: Omit<MarkdownProps, 'value'> & {
    value: { html: string }
    resolver: MarkdownRefResolver
  },
) {
  const actions = useDiagramMarkdownRefActions()

  // Element refs are links when element details are enabled, view refs when navigation is enabled
  const interactivity = useMarkdownRefsInteractivity(actions, resolver)

  const handlers = useMemo(() => ({
    onClick: (e: MouseEvent<HTMLDivElement>) => {
      if (!interactivity.activate(e)) {
        props.onClick?.(e)
      }
    },
    onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== 'Enter' || !interactivity.activate(e)) {
        props.onKeyDown?.(e)
      }
    },
    onMouseOver: (e: MouseEvent<HTMLDivElement>) => {
      interactivity.open(e.target, OPEN_DELAY)
      props.onMouseOver?.(e)
    },
    onMouseOut: (e: MouseEvent<HTMLDivElement>) => {
      const from = interactivity.closestRef(e.target)
      if (from && !(e.relatedTarget instanceof Node && from.contains(e.relatedTarget))) {
        interactivity.close(CLOSE_DELAY)
      }
      props.onMouseOut?.(e)
    },
    onFocus: (e: FocusEvent<HTMLDivElement>) => {
      interactivity.open(e.target)
      props.onFocus?.(e)
    },
    onBlur: (e: FocusEvent<HTMLDivElement>) => {
      if (!interactivity.isInsidePreview(e.relatedTarget)) {
        interactivity.close()
      }
      props.onBlur?.(e)
    },
  }), [interactivity])

  return (
    <>
      <Markdown
        {...props}
        {...handlers}
        className={cx(refsStyles, className)} />
      <MarkdownRefPopover interactivity={interactivity} />
    </>
  )
}

const OPEN_DELAY = 400
const CLOSE_DELAY = 150

function MarkdownRefPopover({ interactivity }: { interactivity: Interactivity }) {
  const rootContainer = useRootContainerRef()
  const previewId = interactivity.previewId
  const { opened, activeElement } = useAtom(interactivity.$active, (state) => ({
    opened: state.opened,
    activeElement: state.opened ? state.element : null,
  }), shallowEqual)

  const portalProps = useAtom(interactivity.$activeElement, (element) => ({
    target: element?.closest('dialog') ?? rootContainer.current ?? 'body',
  }), shallowEqual)

  useEffect(() => {
    if (!activeElement || !opened) {
      return
    }
    activeElement.setAttribute('aria-describedby', previewId)
    // Escape closes the preview only: overlays close on Escape on document.body (capture phase),
    // window listener in the capture phase runs before them
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        interactivity.close()
      }
    }
    window.addEventListener('keydown', onKeyDown, { capture: true })
    return () => {
      activeElement.removeAttribute('aria-describedby')
      window.removeEventListener('keydown', onKeyDown, { capture: true })
    }
  }, [activeElement, opened, interactivity])

  const { close, clearTimer } = interactivity

  if (!activeElement) {
    return null
  }
  return (
    <Popover
      opened={opened}
      onClose={() => close()}
      position="bottom-start"
      offset={6}
      shadow="md"
      // Above dropdowns and panels that host Markdown (e.g. relationship popover)
      zIndex={token.var('zIndex.tooltip')}
      withRoles={false}
      trapFocus={false}
      returnFocus={false}
      transitionProps={{ duration: 100 }}
      // Inside the element details card (modal dialog in the top layer) the preview must be inside the dialog
      portalProps={portalProps}
    >
      <PopoverAnchor element={activeElement} />
      <PopoverDropdown
        id={previewId}
        role="tooltip"
        className={previewStyles}
        onMouseEnter={() => clearTimer()}
        onMouseLeave={() => close(CLOSE_DELAY)}
        // The preview is portalled, but React events bubble to the owners of this Markdown
        onClick={stopPropagation}
        onDoubleClick={stopPropagation}
        onPointerDown={stopPropagation}
        onMouseDown={stopPropagation}
      >
        <MarkdownRefPreviewCard interactivity={interactivity} />
      </PopoverDropdown>
    </Popover>
  )
}
// }

/**
 * Anchors the popover to an element that is not a React child (refs are rendered from HTML)
 */
function PopoverAnchor({ element }: { element: HTMLElement }) {
  const { reference } = usePopoverContext()
  useLayoutEffect(() => {
    reference(element)
  }, [reference, element])
  return null
}

const previewStyles = css({
  maxWidth: '[320px]',
  paddingX: '3',
  paddingY: '2',
})

const previewHeaderStyles = css({
  display: 'flex',
  alignItems: 'flex-start',
  gap: '2',
})

const previewIconStyles = css({
  flex: '[0 0 20px]',
  boxSize: '[20px]',
  marginTop: '[1px]',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '& :where(svg, img)': {
    width: '100%',
    height: 'auto',
    maxHeight: '100%',
    pointerEvents: 'none',
  },
  '& img': {
    objectFit: 'contain',
  },
})

const previewBodyStyles = css({
  marginTop: '1.5',
  lineClamp: 4,
  '& :where(p:last-child)': {
    marginBottom: '0',
  },
})

/**
 * Content of the preview card of a ref (exported for tests)
 */
export function MarkdownRefPreviewCard({ interactivity }: { interactivity: Interactivity }) {
  const resolved = useAtom(interactivity.$active, s => s.resolved, deepEqual)
  if (!resolved) {
    return null
  }
  if (resolved.state === 'missing') {
    return <Text fz="xs" c="dimmed">{resolved.message}</Text>
  }
  const { title, meta, body } = resolved.preview
  const icon = resolved.kind === 'element'
    ? <IconRenderer element={{ id: resolved.fqn, title, icon: resolved.icon }} className={previewIconStyles} />
    : (
      <div className={previewIconStyles}>
        <ViewIcon type={resolved.viewType} size={16} />
      </div>
    )

  return (
    <>
      <div className={previewHeaderStyles}>
        {icon}
        <Box minW="0">
          <Text fz="sm" fw={500} lh={1.3}>{title}</Text>
          <Txt size="xxs" dimmed mt={'1'}>{meta}</Txt>
        </Box>
      </div>
      {body.nonEmpty && <Markdown value={body} fontSize="sm" textScale={0.8} className={previewBodyStyles} />}
      <Button
        size="compact-xs"
        variant="default"
        fz={'xxs'}
        mt="xs"
        onClick={() => interactivity.openRef(resolved)}
      >
        {resolved.kind === 'element' ? 'Open details' : 'Open view'}
      </Button>
    </>
  )
}

function stopPropagation(e: SyntheticEvent) {
  e.stopPropagation()
}
