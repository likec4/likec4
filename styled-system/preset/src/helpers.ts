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
