import type { RichTextOrEmpty as RichTextType } from '@likec4/core/types'
import { css, cx } from '@likec4/styles/css'
import { Box } from '@likec4/styles/jsx'
import { markdownBlock } from '@likec4/styles/recipes'
import type { Tokens } from '@likec4/styles/tokens'
import { Popover, PopoverDropdown, Text, usePopoverContext } from '@mantine/core'
import {
  type ComponentPropsWithoutRef,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type SyntheticEvent,
  forwardRef,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useOptionalLikeC4Model } from '../context/LikeC4ModelContext'
import { type MarkdownRefActions, MarkdownRefsProvider, useMarkdownRefActions } from '../context/MarkdownRefsContext'
import { useRootContainerContext } from '../context/RootContainerContext'
import {
  type MarkdownRefResolver,
  type ResolvedMarkdownRef,
  createMarkdownRefResolver,
  parseMarkdownRefAnchor,
  resolveMarkdownRefs,
} from './markdown-refs'

export type MarkdownProps =
  & Omit<ComponentPropsWithoutRef<'div'>, 'dangerouslySetInnerHTML' | 'children' | 'color' | 'translate'>
  & {
    value: RichTextType

    /**
     * When markdown block is used inside a diagram node, this variant should be used to apply the likec4 palette.
     * @default false
     */
    uselikec4palette?: boolean
    /**
     * Scale factor for the block
     * @default 1
     */
    textScale?: number

    /**
     * Font size for the block
     * @default 'md'
     */
    fontSize?: Tokens['fontSizes'] | undefined

    /**
     * If true, the component will not render anything if the value is empty.
     * @default false
     */
    hideIfEmpty?: boolean | undefined
    /**
     * Text to show if the value is empty.
     * @default "no content"
     */
    emptyText?: string
  }

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

const interactiveRefSelector = '[data-likec4-ref-state="link"], [data-likec4-ref-state="missing"]'

export const Markdown = forwardRef<HTMLDivElement, MarkdownProps>(({
  value,
  textScale = 1,
  uselikec4palette = false,
  hideIfEmpty = false,
  emptyText = 'no content',
  className,
  style,
  fontSize,
  ...props
}, ref) => {
  const model = useOptionalLikeC4Model()
  const actions = useMarkdownRefActions()
  const canOpenElement = !!actions?.openElement
  const canOpenView = !!actions?.openView

  const resolver = useMemo(
    () => createMarkdownRefResolver(model, { elements: canOpenElement, views: canOpenView }),
    [model, canOpenElement, canOpenView],
  )

  const html = value.isMarkdown && value.nonEmpty ? value.html : null
  const resolvedHtml = useMemo(
    () => html !== null ? resolveMarkdownRefs(html, resolver) : null,
    [html, resolver],
  )

  // Refs are interactive only inside MarkdownRefsProvider (overlays and panels)
  const hasRefs = resolvedHtml !== null && resolvedHtml.includes('data-likec4-ref')
  const refs = useMarkdownRefsInteractivity(hasRefs ? actions : null, resolver, props)

  if (value.isEmpty && hideIfEmpty) {
    return null
  }
  const content = value.nonEmpty
    ? resolvedHtml !== null
      ? { dangerouslySetInnerHTML: { __html: resolvedHtml } }
      : { children: <p>{value.text}</p> }
    : { children: <Text component="span" fz={'xs'} c="dimmed" style={{ userSelect: 'none' }}>{emptyText}</Text> }

  return (
    <>
      <Box
        {...props}
        {...refs.handlers}
        ref={ref}
        className={cx(
          markdownBlock({
            uselikec4palette,
            value: value.isMarkdown ? 'markdown' : 'plaintext',
          }),
          hasRefs && refsStyles,
          className,
        )}
        style={{
          ...style,
          ...(fontSize && {
            '--text-fz': `var(--font-sizes-${fontSize}, var(--font-sizes-md))`,
          }),
          ...(textScale !== 1 && {
            ['--mantine-scale']: textScale,
          }),
        }}
        {...content}
      />
      {refs.preview}
    </>
  )
})
Markdown.displayName = 'Markdown'

type DelegatedHandlers = Pick<
  MarkdownProps,
  'onClick' | 'onKeyDown' | 'onMouseOver' | 'onMouseOut' | 'onFocus' | 'onBlur'
>

type ActiveRef = {
  element: HTMLElement
  resolved: Exclude<ResolvedMarkdownRef, { state: 'text' }>
  opened: boolean
}

const noInteractivity = {
  handlers: {},
  preview: null,
}

const OPEN_DELAY = 400
const CLOSE_DELAY = 150

/**
 * Delegated event handlers for refs: one set of listeners on the Markdown block for all refs in it.
 * Activates links on click and Enter, shows a preview card on hover and focus.
 * Handlers from props are composed (called for events that are not ref activations).
 */
function useMarkdownRefsInteractivity(
  actions: MarkdownRefActions | null,
  resolver: MarkdownRefResolver,
  props: DelegatedHandlers,
): { handlers: DelegatedHandlers; preview: ReactNode } {
  const rootContainer = useRootContainerContext()
  const [active, setActive] = useState<ActiveRef | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const previewId = useId()

  useEffect(() => () => clearTimeout(timer.current), [])

  const opened = !!actions && !!active?.opened && active.element.isConnected
  const activeElement = opened ? active.element : null

  useEffect(() => {
    if (!activeElement) {
      return
    }
    activeElement.setAttribute('aria-describedby', previewId)
    // Escape closes the preview only: overlays close on Escape on document.body (capture phase),
    // window listener in the capture phase runs before them
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        clearTimeout(timer.current)
        setActive(a => a && { ...a, opened: false })
      }
    }
    window.addEventListener('keydown', onKeyDown, { capture: true })
    return () => {
      activeElement.removeAttribute('aria-describedby')
      window.removeEventListener('keydown', onKeyDown, { capture: true })
    }
  }, [activeElement, previewId])

  if (!actions) {
    return noInteractivity
  }

  const open = (target: EventTarget, delay: number) => {
    const element = closestRef(target, interactiveRefSelector)
    if (!element) {
      return
    }
    clearTimeout(timer.current)
    if (opened && active.element === element) {
      return
    }
    const anchor = parseMarkdownRefAnchor(element)
    const resolved = anchor ? resolver(anchor) : null
    if (!resolved || resolved.state === 'text') {
      return
    }
    const show = () => setActive({ element, resolved, opened: true })
    // Moving from one ref to another while a preview is open switches immediately
    if (delay === 0 || opened) {
      show()
    } else {
      timer.current = setTimeout(show, delay)
    }
  }

  const close = (delay: number) => {
    clearTimeout(timer.current)
    const hide = () => setActive(a => a && { ...a, opened: false })
    if (delay === 0) {
      hide()
    } else {
      timer.current = setTimeout(hide, delay)
    }
  }

  /**
   * @returns true if the event activated a ref
   */
  const activate = (e: SyntheticEvent): boolean => {
    const element = closestRef(e.target, '[data-likec4-ref-state="link"]')
    const anchor = element ? parseMarkdownRefAnchor(element) : null
    const resolved = anchor ? resolver(anchor) : null
    if (resolved?.state !== 'link') {
      return false
    }
    e.preventDefault()
    e.stopPropagation()
    close(0)
    switch (resolved.kind) {
      case 'element':
        actions.openElement?.(resolved.fqn)
        break
      case 'view':
        actions.openView?.(resolved.viewId)
        break
    }
    return true
  }

  const isInsidePreview = (node: EventTarget | null) =>
    node instanceof Node && !!document.getElementById(previewId)?.contains(node)

  return {
    handlers: {
      onClick: (e: MouseEvent<HTMLDivElement>) => {
        if (!activate(e)) {
          props.onClick?.(e)
        }
      },
      onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key !== 'Enter' || !activate(e)) {
          props.onKeyDown?.(e)
        }
      },
      onMouseOver: (e: MouseEvent<HTMLDivElement>) => {
        open(e.target, OPEN_DELAY)
        props.onMouseOver?.(e)
      },
      onMouseOut: (e: MouseEvent<HTMLDivElement>) => {
        const from = closestRef(e.target, interactiveRefSelector)
        if (from && !(e.relatedTarget instanceof Node && from.contains(e.relatedTarget))) {
          close(CLOSE_DELAY)
        }
        props.onMouseOut?.(e)
      },
      onFocus: (e: FocusEvent<HTMLDivElement>) => {
        open(e.target, 0)
        props.onFocus?.(e)
      },
      onBlur: (e: FocusEvent<HTMLDivElement>) => {
        if (!isInsidePreview(e.relatedTarget)) {
          close(0)
        }
        props.onBlur?.(e)
      },
    },
    preview: active && (
      <Popover
        opened={opened}
        onClose={() => close(0)}
        position="bottom-start"
        offset={6}
        shadow="md"
        withRoles={false}
        trapFocus={false}
        returnFocus={false}
        transitionProps={{ duration: 100 }}
        // Inside the element details card (modal dialog in the top layer) the preview must be inside the dialog
        portalProps={{
          target: active.element.closest('dialog') ?? rootContainer?.ref.current ?? 'body',
        }}
      >
        <PopoverAnchor element={active.element} />
        <PopoverDropdown
          id={previewId}
          role="tooltip"
          className={previewStyles}
          onMouseEnter={() => clearTimeout(timer.current)}
          onMouseLeave={() => close(CLOSE_DELAY)}
          // The preview is portalled, but React events bubble to the owners of this Markdown
          onClick={stopPropagation}
          onDoubleClick={stopPropagation}
          onPointerDown={stopPropagation}
          onMouseDown={stopPropagation}
        >
          <MarkdownRefPreviewCard resolved={active.resolved} />
        </PopoverDropdown>
      </Popover>
    ),
  }
}

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

const previewBodyStyles = css({
  marginTop: '1.5',
  lineClamp: '4',
  '& :where(p:last-child)': {
    marginBottom: '0',
  },
})

/**
 * Content of the preview card of a ref (exported for tests)
 */
export function MarkdownRefPreviewCard({ resolved }: { resolved: ActiveRef['resolved'] }) {
  if (resolved.state === 'missing') {
    return <Text fz="xs" c="dimmed">{resolved.message}</Text>
  }
  const { title, meta, body } = resolved.preview
  return (
    <>
      <Text fz="sm" fw={600} lh={1.3}>{title}</Text>
      <Text fz="xs" c="dimmed" mt={2}>{meta}</Text>
      {body.nonEmpty && (
        // Refs inside the preview are plain text: no nested previews and clicks
        <MarkdownRefsProvider value={null}>
          <Markdown value={body} fontSize="sm" className={previewBodyStyles} />
        </MarkdownRefsProvider>
      )}
      <Text fz="xs" c="dimmed" mt="xs">
        {resolved.kind === 'element' ? 'Click to open details' : 'Click to open view'}
      </Text>
    </>
  )
}

function stopPropagation(e: SyntheticEvent) {
  e.stopPropagation()
}

function closestRef(target: EventTarget | null, selector: string): HTMLElement | null {
  if (!(target instanceof Element)) {
    return null
  }
  const element = target.closest(selector)
  return element instanceof HTMLElement ? element : null
}
