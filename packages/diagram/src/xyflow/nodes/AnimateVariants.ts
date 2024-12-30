import { fallbackVar } from '@vanilla-extract/css'
import type { Variants } from 'framer-motion'
import { useMemo, useState } from 'react'
import { isEmpty, isString } from 'remeda'
import { vars } from '../../theme-vars'

const DEFAULT_SCALE_BY  = 0
const SELECTED_SCALE_BY = 16
const HOVERED_SCALE_BY  = 12
const TAP_SCALE_BY      = -16

const DELAY_NODE = 0.1
const DELAY_NODE_CHILDREN = 0.06

const DIMMED_OPACITY = 0.15
const DIMMED_DELAY = 0.2

export type VariantKeys = 'dimmed' | 'hoverd' | 'idle' | 'selected' | 'tap'

export const NodeVariants = (width: number, height: number) => {

  const scaleBy = (diffPx: number) => ({
    scaleX: (width + diffPx) / width,
    scaleY: (height + diffPx) / height
  })

  return {
    dimmed: {
      filter: `grayscale(0.85) ${fallbackVar(vars.safariAnimationHook, 'blur(1px)')}`,
      opacity: DIMMED_OPACITY,
      transition: {
        delay: DIMMED_DELAY,
        ease: 'easeInOut'
      },
      willChange: 'opacity, filter'
    },
    idle: {
      ...scaleBy(DEFAULT_SCALE_BY),
      transition: {
          delay: DELAY_NODE,
          delayChildren: DELAY_NODE_CHILDREN
      },
      filter: `grayscale(0) ${fallbackVar(vars.safariAnimationHook, 'blur(0px)')}`
    },
    selected: {
      ...scaleBy(SELECTED_SCALE_BY)
    },
    hovered: {
      ...scaleBy(HOVERED_SCALE_BY),
      transition: {
        delay: DELAY_NODE,
        delayChildren: DELAY_NODE_CHILDREN
      }
    },
    tap: {
      ...scaleBy(TAP_SCALE_BY)
    }
  } satisfies Variants
}

export function useFramerAnimateVariants() {
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
