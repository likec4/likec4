import { useMemo, useState } from 'react'
import { isEmpty, isString } from 'remeda'
import { useDiagramState } from '../../hooks'
import type { NodeProps } from '@xyflow/react'
import type { ElementXYFlowNode } from '../types'
import type { PickDeep } from 'type-fest'

type VariantKeys = 'hovered' | 'idle' | 'selected' | 'tap' | string[]

type ElementNodeProps = PickDeep<NodeProps<ElementXYFlowNode>, 'id' | 'data.element' | 'dragging' | 'selected'>

function getFramerAnimateVariants() {
  const [variants, setVariants] = useState<string[] | null>(null)

  const handlers = useMemo(() => {
    const getTarget = (e: MouseEvent | undefined) => {
      try {
        // 🤔 Sometimes target is null
        return (e?.target as HTMLElement | null)?.closest('[data-animate-target]')?.getAttribute('data-animate-target')
          ?? null
      } catch (_e) {
        console.warn(`Failed to get animate target`, _e)
        // noop
        return null
      }
    }

    const onHoverStart = (e: MouseEvent) => {
      e?.stopPropagation()
      const hoverTarget = getTarget(e)
      if (!isString(hoverTarget) || isEmpty(hoverTarget)) {
        setVariants(null)
        return
      }
      setVariants(['hovered', `hovered:${hoverTarget}`])
    }

    const resetVariants = (e: MouseEvent) => {
      e?.stopPropagation()
      setVariants(null)
    }

    return ({
      onTapStart: (e: MouseEvent) => {
        e?.stopPropagation()
        const tapTarget = getTarget(e)
        if (!isString(tapTarget)) {
          setVariants(null)
          return
        }
        if (isEmpty(tapTarget)) {
          setVariants([
            'hovered',
            'tap'
          ])
        } else {
          setVariants([
            'hovered',
            `hovered:${tapTarget}`,
            `tap:${tapTarget}`
          ])
        }
      },
      onHoverStart,
      onHoverEnd: resetVariants,
      onTapCancel: resetVariants,
      onTap: onHoverStart
    })
  }, [setVariants])

  return [variants, handlers] as const
}

export function useFramerAnimateVariants({
  id,
  data: {
    element
  },
  dragging,
  selected = false,
}: ElementNodeProps) {

  const [variants, handlers] = getFramerAnimateVariants()

  const {
    isInteractive,
    isInActiveOverlay,
    isHovered
  } = useDiagramState(s => ({
    isInteractive: s.nodesDraggable || s.nodesSelectable || s.enableElementDetails || s.enableRelationshipBrowser
      || (!!s.onNavigateTo && !!element.navigateTo),
    isInActiveOverlay: (s.activeOverlay?.elementDetails ?? s.activeOverlay?.relationshipsOf) === id,
    isHovered: s.hoveredNodeId === id,
  }))

  let activeVariant: VariantKeys
  switch (true) {
    case isInActiveOverlay:
      activeVariant = 'idle'
      break;
    case dragging && selected:
      activeVariant = 'selected'
      break;
    case dragging:
      activeVariant = 'idle'
      break;
    case isInteractive && isHovered:
      activeVariant = 'hovered'
      break;
    case selected:
      activeVariant = 'selected'
      break;
    default:
      activeVariant = 'idle'
      break;
  }

  if (isHovered && !dragging && !isInActiveOverlay) {
    activeVariant = variants ?? activeVariant
  }

  return [activeVariant, handlers] as const
}
