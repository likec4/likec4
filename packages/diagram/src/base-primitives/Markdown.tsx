import type { RichTextOrEmpty as RichTextType } from '@likec4/core/types'
import { css, cx } from '@likec4/styles/css'
import { Box } from '@likec4/styles/jsx'
import { markdownBlock } from '@likec4/styles/recipes'
import type { Tokens } from '@likec4/styles/tokens'
import { Text, Tooltip } from '@mantine/core'
import {
  type ComponentPropsWithoutRef,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type SyntheticEvent,
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useOptionalLikeC4Model } from '../context/LikeC4ModelContext'
import { type MarkdownRefActions, useMarkdownRefActions } from '../context/MarkdownRefsContext'
import { useRootContainerContext } from '../context/RootContainerContext'
import {
  type MarkdownRefResolver,
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
      {refs.tooltip}
    </>
  )
})
Markdown.displayName = 'Markdown'

type DelegatedHandlers = Pick<
  MarkdownProps,
  'onClick' | 'onKeyDown' | 'onMouseOver' | 'onMouseOut' | 'onFocus' | 'onBlur'
>

type HoveredRef = {
  element: HTMLElement
  tooltip: string
}

const noInteractivity = {
  handlers: {},
  tooltip: null,
}

/**
 * Delegated event handlers for refs: one set of listeners on the Markdown block for all refs in it.
 * Activates links on click and Enter, shows a tooltip on hover and focus.
 * Handlers from props are composed (called for events that are not ref activations).
 */
function useMarkdownRefsInteractivity(
  actions: MarkdownRefActions | null,
  resolver: MarkdownRefResolver,
  props: DelegatedHandlers,
): { handlers: DelegatedHandlers; tooltip: ReactNode } {
  const rootContainer = useRootContainerContext()
  const [hovered, setHovered] = useState<HoveredRef | null>(null)
  const openTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(openTimer.current), [])

  if (!actions) {
    return noInteractivity
  }

  const showTooltip = (target: EventTarget, delay: number) => {
    const element = closestRef(target, interactiveRefSelector)
    if (!element || element === hovered?.element) {
      return
    }
    const anchor = parseMarkdownRefAnchor(element)
    if (!anchor) {
      return
    }
    const tooltip = resolver(anchor).tooltip
    clearTimeout(openTimer.current)
    openTimer.current = setTimeout(() => setHovered({ element, tooltip }), delay)
  }

  const hideTooltip = (related: EventTarget | null) => {
    if (hovered && related instanceof Node && hovered.element.contains(related)) {
      return
    }
    clearTimeout(openTimer.current)
    setHovered(null)
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
    clearTimeout(openTimer.current)
    setHovered(null)
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
        showTooltip(e.target, 400)
        props.onMouseOver?.(e)
      },
      onMouseOut: (e: MouseEvent<HTMLDivElement>) => {
        hideTooltip(e.relatedTarget)
        props.onMouseOut?.(e)
      },
      onFocus: (e: FocusEvent<HTMLDivElement>) => {
        showTooltip(e.target, 0)
        props.onFocus?.(e)
      },
      onBlur: (e: FocusEvent<HTMLDivElement>) => {
        hideTooltip(e.relatedTarget)
        props.onBlur?.(e)
      },
    },
    tooltip: hovered?.element.isConnected && (
      <Tooltip
        target={hovered.element}
        opened
        label={hovered.tooltip}
        offset={4}
        // Inside the element details card (modal dialog in the top layer) the tooltip must be inside the dialog
        portalProps={{
          target: hovered.element.closest('dialog') ?? rootContainer?.ref.current ?? 'body',
        }}
      />
    ),
  }
}

function closestRef(target: EventTarget | null, selector: string): HTMLElement | null {
  if (!(target instanceof Element)) {
    return null
  }
  const element = target.closest(selector)
  return element instanceof HTMLElement ? element : null
}
