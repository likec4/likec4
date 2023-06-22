import { easings, useSpring } from '@react-spring/konva'
import { useCallback, useMemo } from 'react'

export const useNodeToolbarSpring =  () => {

  const from = {
    opacity: 0.6,
    scale: 0.8,
  }
  const [{
    opacity,
    scale,
  }, api] = useSpring(() => ({
    from: from,
    config: {
      easing: easings.easeInOutQuint,
      duration: 250
    }
  }))

  const toggle = useCallback((visible: boolean) => {
    if (visible) {
      let delay = opacity.isAnimating ? 0 : 300
      if (opacity.isDelayed === true) {
        api.stop(true)
        delay = 0
      }
      api.start({
        to: {
          opacity: 1,
          scale: 1,
        },
        delay,
        config: {
          easing: easings.easeOutExpo
        }
      })
    } else {
      api.start({
        to: { ...from },
        delay: 120,
        config: {
          easing: easings.easeInExpo
        }
      })
    }
  }, [opacity, api])

  return [
    {
      visible: useMemo(() => opacity.to(v => v > from.opacity + 0.09), [opacity]),
      opacity,
      scale
    },
    toggle
  ] as const
}
