import { useMemo, useState } from 'react'
import { isEmpty, isString } from 'remeda'

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
