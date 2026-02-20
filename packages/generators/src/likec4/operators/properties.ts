import type { Color, ElementStyle, Icon, Link, MarkdownOrString } from '@likec4/core/types'
import { entries, isArray, isString, piped } from 'remeda'
import type { ConditionalKeys } from 'type-fest'
import type { Op } from './base'
import {
  body,
  foreach,
  guard,
  inlineText,
  lines,
  markdownOrString,
  print,
  property,
  select,
  separateNewLine,
  spaceBetween,
  text,
} from './base'

/**
 * Print a property from the context as a text.
 */
export function textProperty<A>(
  propertyName: ConditionalKeys<NoInfer<A>, string | undefined | null>,
  keyword?: string,
): Op<A> {
  return select(
    e => e[propertyName] as string,
    spaceBetween(
      print(keyword ?? propertyName as string),
      text(),
    ),
  )
}

/**
 * Print a property from the context as an enum value (i.e. as it is)
 */
export function enumProperty<A, P extends keyof A & string>(
  propertyName: P,
  keyword?: string,
): Op<A> {
  return select(
    e => e[propertyName] as string,
    spaceBetween(
      print(keyword ?? propertyName as string),
      print(),
    ),
  )
}

/**
 * Print a property from the context as a markdown string.
 */
export function markdownProperty<A>(
  propertyName: ConditionalKeys<NoInfer<A>, string | MarkdownOrString | undefined | null>,
  keyword?: string,
): Op<A> {
  return select(
    e => e[propertyName] as MarkdownOrString,
    spaceBetween(
      print(keyword ?? propertyName as string),
      markdownOrString(),
    ),
  )
}

export const titleProperty = <A extends { title?: string | null }>(): Op<A> =>
  property(
    'title',
    spaceBetween(
      print('title'),
      text(),
    ),
  )

export const summaryProperty = <A extends { summary?: MarkdownOrString | null }>(): Op<A> =>
  property(
    'summary',
    spaceBetween(
      print('summary'),
      markdownOrString(),
    ),
  )

export const descriptionProperty = <A extends { description?: MarkdownOrString | null }>(): Op<A> =>
  property(
    'description',
    spaceBetween(
      print('description'),
      markdownOrString(),
    ),
  )

export const technologyProperty = <A extends { technology?: string | null }>(): Op<A> =>
  property(
    'technology',
    spaceBetween(
      print('technology'),
      text(),
    ),
  )

export const notationProperty = <A extends { notation?: string | null }>(): Op<A> =>
  property(
    'notation',
    spaceBetween(
      print('notation'),
      text(),
    ),
  )

function metadataValue(): Op<string | string[]> {
  return piped(
    guard(
      isString,
      text(),
    ),
    guard(
      isArray,
      body('[', ']')(
        foreach(
          text(),
          {
            appendNewLineIfNotEmpty: true,
            suffix(element, index, isLast) {
              return !isLast ? ',' : undefined
            },
          },
        ),
      ),
    ),
  )
}

export const metadataProperty = <A extends { metadata?: Record<string, string | string[]> | null }>(): Op<A> =>
  select(
    e => e.metadata ? entries(e.metadata) : undefined,
    body('metadata')(
      foreach(
        spaceBetween(
          print(v => v[0]),
          property('1', metadataValue()),
        ),
        separateNewLine(),
      ),
    ),
  )

export const tagsProperty = <A extends { tags?: readonly string[] | null }>(): Op<A> =>
  property(
    'tags',
    print(v => v.map(t => `#${t}`).join(', ')),
  )

export const linksProperty = <A extends { links?: readonly Link[] | null }>(): Op<A> =>
  property(
    'links',
    foreach(
      spaceBetween(
        print('link'),
        property('url'),
        property('title', inlineText()),
      ),
      separateNewLine(),
    ),
  )

export function styleProperty<A extends { style?: ElementStyle }>(): Op<A> {
  return select(
    e => e.style,
    body('style')(
      styleProperties(),
    ),
  )
}

export function colorProperty<A extends { color?: Color }>(): Op<A> {
  return property(
    'color',
    spaceBetween(
      print('color'),
      print(),
    ),
  )
}

export function iconProperty<A extends { icon?: Icon }>(): Op<A> {
  return property(
    'icon',
    spaceBetween(
      print('icon'),
      print(),
    ),
  )
}

export function styleProperties<A extends ElementStyle>(): Op<A> {
  return lines(
    enumProperty('shape'),
    colorProperty(),
    iconProperty(),
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
