import { useCustomCompareEffect } from '@react-hookz/web'
import { shallowEqual } from 'fast-equals'
import { type DependencyList, type EffectCallback, useEffect, useRef } from 'react'

export function useUpdateEffect(
  callback: EffectCallback,
  deps: DependencyList
) {
  const render = useRef(false)
  const effect = useRef(false)

  useCustomCompareEffect(
    () => {
      const mounted = render.current
      const run = mounted && effect.current
      if (run) {
        return callback()
      }
      effect.current = true
    },
    deps,
    shallowEqual
  )

  useEffect(() => {
    render.current = true
    return () => {
      render.current = false
    }
  }, [])
}
