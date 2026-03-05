import { type Color, type ElementStyle, type Link, type MarkdownOrString, exact } from '@likec4/core/types'
import { entries, isArray, isString, piped } from 'remeda'
import type { ConditionalKeys } from 'type-fest'
import * as common from '../schemas/common'
import type { Op } from './base'
import {
  body,
  foreach,
  foreachNewLine,
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
  zodOp,
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

export const titleProperty = <A extends { title?: string | null | undefined }>(): Op<A> =>
  property(
    'title',
    spaceBetween(
      print('title'),
      text(),
    ),
  )

export const summaryProperty = <A extends { summary?: string | MarkdownOrString | null | undefined }>(): Op<A> =>
  property(
    'summary',
    spaceBetween(
      print('summary'),
      markdownOrString(),
    ),
  )

export const descriptionProperty = <A extends { description?: string | MarkdownOrString | null | undefined }>(): Op<
  A
> =>
  property(
    'description',
    spaceBetween(
      print('description'),
      markdownOrString(),
    ),
  )

export const notesProperty = <A extends { notes?: string | MarkdownOrString | null | undefined }>(): Op<A> =>
  property(
    'notes',
    spaceBetween(
      print('notes'),
      markdownOrString(),
    ),
  )

export const technologyProperty = <A extends { technology?: string | null | undefined }>(): Op<A> =>
  property(
    'technology',
    spaceBetween(
      print('technology'),
      text(),
    ),
  )

export const notationProperty = <A extends { notation?: string | null | undefined }>(): Op<A> =>
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

export const metadataProperty = <A extends { metadata?: Record<string, string | string[]> | null }>(): Op<
  A
> =>
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

export const tagsProperty = <A extends { tags?: readonly string[] | undefined | null }>(): Op<A> =>
  property(
    'tags',
    print(v => v.map(t => `#${t}`).join(', ')),
  )

type LinkLike = string | { url: string; title?: string | undefined }

export function linkProperty<A extends LinkLike>(): Op<A> {
  return spaceBetween(
    select(
      (l): Link => typeof l === 'string' ? { url: l } : exact({ url: l.url, title: l.title }),
      print('link'),
      print(v => v.url),
      property('title', inlineText()),
    ),
  )
}

export const linksProperty = <
  A extends { links?: ReadonlyArray<LinkLike> | null | undefined },
>(): Op<A> =>
  property(
    'links',
    foreachNewLine(
      linkProperty(),
    ),
  )

export function styleBlockProperty<A extends { style?: ElementStyle | undefined | null }>(): Op<A> {
  return select(
    e => e.style,
    body('style')(
      styleProperties(),
    ),
  )
}

export function colorProperty<A extends { color?: Color | undefined | null }>(): Op<A> {
  return property(
    'color',
    spaceBetween(
      print('color'),
      print(),
    ),
  )
}

export function opacityProperty<A extends { opacity?: number | undefined | null }>(): Op<A> {
  return property(
    'opacity',
    spaceBetween(
      print('opacity'),
      print(v => `${v}%`),
    ),
  )
}

export function iconProperty<A extends { icon?: string | undefined | null }>(): Op<A> {
  return property(
    'icon',
    spaceBetween(
      print('icon'),
      print(),
    ),
  )
}

export const styleProperties = zodOp(common.style)(
  lines(
    property('shape'),
    colorProperty(),
    iconProperty(),
    property('iconColor'),
    property('iconSize'),
    property('iconPosition'),
    property('border'),
    opacityProperty(),
    property('size'),
    property('padding'),
    property('textSize'),
    property('multiple'),
  ),
)
