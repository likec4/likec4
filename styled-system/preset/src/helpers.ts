/**
 * Changes the alpha channel of a color
 * @param color color value or CSS variable
 * @param percentage Alpha channel value
 * @returns
 */
export function alpha(color: string, percentage: number | string = 50): string {
  let alpha = percentage
  if (typeof percentage === 'number') {
    if (percentage > 0 && percentage < 1) {
      percentage *= 100
    }
    alpha = `${percentage}%`
  }
  return `oklch(from ${color} l c h / ${alpha})`
}

export function rem(pixels: number) {
  // return `${(pixels / 16).toPrecision(3)}rem`
  return `${pixels}px`
}

export type Shades = readonly [string, string, string, string, string, string, string, string, string, string]
/**
 * Creates a ramp of colors from an array of shades
 * @param shades Array of 10 colors
 * @returns Object with keys 0-9 and values as objects with value property
 */
export function ramp(
  shades: Shades,
): Record<0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9, { value: string }> {
  return Object.fromEntries(shades.map((shade, index) => [index, { value: shade }])) as any
}
