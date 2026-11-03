import { useCallback, useEffect, useRef, useState } from 'react'
import { loadEdgeLabelFont } from '../utils/measure-edge-label'

/**
 * Edge labels are measured with the canvas, so font faces must be loaded first
 * (e.g. cyrillic subset is loaded only when it is used).
 *
 * Returns a version, that is incremented when required font faces are loaded (use it as a dependency
 * of the layout to measure labels again), and a function to request font faces for given labels.
 */
export function useEdgeLabelFontLoader(): [version: number, ensureLoaded: (labels: ReadonlyArray<string>) => void] {
  const [version, setVersion] = useState(0)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const ensureLoaded = useCallback((labels: ReadonlyArray<string>) => {
    loadEdgeLabelFont(labels)
      .then(loaded => {
        if (loaded && mounted.current) {
          setVersion(v => v + 1)
        }
      })
      .catch(() => {
        // ignore, labels stay measured with the fallback font
      })
  }, [])

  return [version, ensureLoaded]
}
