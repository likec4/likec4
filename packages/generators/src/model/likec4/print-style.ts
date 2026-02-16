import type { ElementStyle } from '@likec4/core/types'
import { type Op, body, lines, print, property, select, spaceBetween } from './base'
import { enumProperty } from './properties'

export function styleProperty<A extends { style?: ElementStyle }>(): Op<A> {
  return select(
    e => e.style,
    body('style')(
      styleProperties(),
    ),
  )
}

export function styleProperties(): Op<ElementStyle> {
  return lines(
    enumProperty('shape'),
    enumProperty('color'),
    enumProperty('icon'),
    enumProperty('iconColor'),
    enumProperty('iconSize'),
    enumProperty('iconPosition'),
    enumProperty('border'),
    property(
      'opacity',
      spaceBetween(
        print('opacity'),
        print(v => `${v}%`),
      ),
    ),
    enumProperty('size'),
    enumProperty('padding'),
    enumProperty('textSize'),
    enumProperty('multiple'),
  )
}
