import { type DependencyList, type EffectCallback, useEffect, useRef } from 'react'

export function useUpdateEffect(
  callback: EffectCallback,
  deps: DependencyList,
  effectFn = useEffect
) {
  const render = useRef(false)
  const effect = useRef(false)

  effectFn(() => {
    const mounted = render.current
    const run = mounted && effect.current
    if (run) {
      return callback()
    }
    effect.current = true
  }, deps)

  effectFn(() => {
    render.current = true
    return () => {
      render.current = false
    }
  }, [])
}
