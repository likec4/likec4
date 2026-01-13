/**
 *  Mixes a color with transparent color by given percentage
 * @param color color value or CSS variable
 * @param percentage percentage of the color to mix with transparent
 * @returns
 */
export function mixTransparent(color: string, percentage = 50): string {
  return `color-mix(in oklab, ${color} ${percentage}%, transparent ${100 - percentage}%)`
}

export function rem(pixels: number) {
  return `${(pixels / 16).toPrecision(3)}rem`
}
