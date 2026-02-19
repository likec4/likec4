import type { Link, MarkdownOrString } from '@likec4/core/types'
import { entries } from 'remeda'
import type { ConditionalKeys } from 'type-fest'
import type { Op } from './base'
import {
  body,
  foreach,
  inlineText,
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

export const metadataProperty = <A extends { metadata?: Record<string, string> | null }>(): Op<A> =>
  select(
    e => e.metadata ? entries(e.metadata) : undefined,
    body('metadata')(
      foreach(
        spaceBetween(
          print(v => v[0]),
          text(v => v[1]),
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
