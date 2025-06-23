import type { MarkdownOrString } from '../types'
import { markdownToText, memoizeProp } from '../utils'

const richtxt = Symbol.for('richtxt')
const symb_text = Symbol.for('text')

const emptyTxt = ''

export interface RichTextEmpty {
  readonly isEmpty: true
  readonly $source: null
  readonly text: null
}

export type RichTextOrEmpty = RichText | RichTextEmpty

export class RichText {
  static memoize(obj: object, source: MarkdownOrString | null | undefined): RichTextOrEmpty {
    return memoizeProp(obj, richtxt, () => RichText.from(source))
  }

  static from(source: MarkdownOrString): RichText
  static from(source: MarkdownOrString | null | undefined): RichTextOrEmpty
  static from(source: MarkdownOrString | null | undefined): RichTextOrEmpty {
    return source ? new RichText(source) : RichText.EMPTY
  }

  static EMPTY: RichTextEmpty = {
    isEmpty: true,
    $source: null,
    text: null,
  }

  public readonly $source: Readonly<MarkdownOrString>

  public readonly isEmpty: boolean

  /**
   * Private constructor to prevent direct instantiation.
   * Use `RichText.from` or `RichText.memoize` instead.
   */
  private constructor(source: MarkdownOrString | string) {
    if (typeof source === 'string') {
      this.$source = { txt: source }
      this.isEmpty = source.trim() === emptyTxt
    } else {
      this.$source = source
      this.isEmpty = true
      if ('md' in source) {
        this.isEmpty = source.md === emptyTxt
      } else {
        this.isEmpty = source.txt === emptyTxt
      }
    }
  }

  /**
   * Returns the text content of the rich text.
   * If the source is a string, it returns the string.
   * If the source is a markdown, it returns the markdown.
   */
  get text(): string {
    if (this.isEmpty) {
      return emptyTxt
    }
    if ('txt' in this.$source) {
      return this.$source.txt
    }
    return memoizeProp(this, symb_text, () => markdownToText(this.$source.md!))
  }
}
