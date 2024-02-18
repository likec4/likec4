import { useEffect, useRef } from 'react'

export function useUpdateEffect(callback: React.EffectCallback, deps: React.DependencyList) {
  const render = useRef(false)
  const effect = useRef(false)

  useEffect(() => {
    const mounted = render.current
    const run = mounted && effect.current
    if (run) {
      return callback()
    }
    effect.current = true
  }, deps)

  useEffect(() => {
    render.current = true
    return () => {
      render.current = false
    }
  }, [])
}
