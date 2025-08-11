import { clamp } from 'remeda'

/**
 * Returns the current device pixel ratio (DPR) given the passed options
 *
 * @param options
 * @returns current device pixel ratio
 */
function getDevicePixelRatio(): number {
  const hasDprProp = typeof window !== 'undefined' && typeof window.devicePixelRatio === 'number'
  const dpr = hasDprProp ? window.devicePixelRatio : 1
  return clamp(Math.floor(dpr), {
    min: 1,
    max: 4,
  })
}

let knownDpr: number | undefined

export function roundDpr(v: number) {
  knownDpr ??= getDevicePixelRatio()
  if (knownDpr < 2) {
    return Math.round(v)
  }
  // https://floating-ui.com/docs/misc#subpixel-and-accelerated-positioning
  return Math.round(v * knownDpr) / knownDpr
}
