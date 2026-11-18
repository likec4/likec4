import { nonexhaustive } from '@likec4/core'
import { useSyncedRef, useUnmountEffect } from '@react-hookz/web'
import { createAtom } from '@xstate/store'
import { shallowEqual } from 'fast-equals'
import { type SyntheticEvent, useId, useMemo, useRef } from 'react'
import { useCallbackRef } from '../../hooks'
import type { MarkdownRefActions } from '../../hooks/useDiagramMarkdownRefActions'
import { type MarkdownRefResolver, type ResolvedMarkdownRef, parseMarkdownRefAnchor } from './markdown-refs'

export const interactiveRefSelector = '[data-likec4-ref-state="link"], [data-likec4-ref-state="missing"]'

export type LinkRef = Extract<ResolvedMarkdownRef, { state: 'link' }>

export type ActiveRefState =
  | Readonly<{
    element: HTMLElement
    resolved: Exclude<ResolvedMarkdownRef, { state: 'text' }>
    opened: true | false
  }>
  | Readonly<{
    element: null
    resolved: null
    opened: false
  }>

const inactiveRefState: ActiveRefState = {
  element: null,
  resolved: null,
  opened: false,
}

/**
 * Delegated event handlers for refs: one set of listeners on the Markdown block for all refs in it.
 * Activates links on click and Enter, shows a preview card on hover and focus.
 * Handlers from props are composed (called for events that are not ref activations).
 */
export function useMarkdownRefsInteractivity(
  actions2: MarkdownRefActions | null,
  resolver3: MarkdownRefResolver,
) {
  const actionsRef = useSyncedRef(actions2)
  const resolve = useCallbackRef(resolver3)

  const previewId = useId()

  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const interactivity = useMemo(() => {
    const $active = createAtom(inactiveRefState, {
      compare: shallowEqual,
    })

    const $activeElement = createAtom<ActiveRefState['element']>(
      () => $active.get().element,
      { compare: (a, b) => a === b },
    )
    const $opened = createAtom<ActiveRefState['opened']>(
      () => {
        const state = $active.get()
        return state.opened && state.element.isConnected
      },
    )

    let animationFrame: number | null = null

    const clearTimer = () => {
      clearTimeout(timer.current)
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
        animationFrame = null
      }
    }

    const open = (target: EventTarget, delay = 0) => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
      animationFrame = requestAnimationFrame(() => {
        animationFrame = null
        const element = closestRef(target, interactiveRefSelector)
        if (!element) {
          return
        }
        clearTimer()
        const state = $active.get()
        if (state.opened && state.element === element) {
          return
        }
        const anchor = parseMarkdownRefAnchor(element)
        const resolved = anchor ? resolve(anchor) : null
        if (!resolved || resolved.state === 'text') {
          return
        }
        const show = () => $active.set(s => ({ ...s, element, resolved, opened: true }))
        // Moving from one ref to another while a preview is open switches immediately
        if (delay === 0 || state.opened) {
          show()
        } else {
          timer.current = setTimeout(show, delay)
        }
      })
    }

    const close = (delay = 0) => {
      clearTimer()
      const hide = () => $active.set(s => ({ ...s, opened: false }))
      if (delay === 0) {
        hide()
      } else {
        timer.current = setTimeout(hide, delay)
      }
    }

    const openRef = (resolved: LinkRef) => {
      close()
      switch (resolved.kind) {
        case 'element':
          actionsRef.current?.openElement?.(resolved.fqn)
          break
        case 'view':
          actionsRef.current?.openView?.(resolved.viewId)
          break
        default:
          nonexhaustive(resolved)
      }
    }

    /**
     * @returns true if the event activated a ref
     */
    const activate = (e: SyntheticEvent): boolean => {
      const element = closestRef(e.target, '[data-likec4-ref-state="link"]')
      const anchor = element ? parseMarkdownRefAnchor(element) : null
      const resolved = anchor ? resolve(anchor) : null
      if (resolved?.state !== 'link') {
        return false
      }
      e.preventDefault()
      e.stopPropagation()
      openRef(resolved)
      return true
    }

    const isInsidePreview = (node: EventTarget | null) =>
      node instanceof Node && !!document.getElementById(previewId)?.contains(node)

    return {
      previewId,
      $active,
      $activeElement,
      $opened,
      open,
      close,
      openRef,
      activate,
      isInsidePreview,
      clearTimer,
      closestRef: (target: EventTarget | null) => closestRef(target, interactiveRefSelector),
      reset: () => {
        clearTimer()
        $active.set(inactiveRefState)
      },
    } as const
  }, [previewId])

  useUnmountEffect(interactivity.reset)

  return interactivity
}

export type Interactivity = ReturnType<typeof useMarkdownRefsInteractivity>

export function closestRef(target: EventTarget | null, selector: string): HTMLElement | null {
  if (!(target instanceof Element)) {
    return null
  }
  const element = target.closest(selector)
  return element instanceof HTMLElement ? element : null
}
