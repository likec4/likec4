import type { MarkdownOrString } from '../types'
import { markdownToText, memoizeProp } from '../utils'

const richtxt = Symbol.for('richtxt')
const symb_text = Symbol.for('text')

export class RichText {
  static memoize(obj: object, source: MarkdownOrString | null | undefined): RichText | null {
    return memoizeProp(obj, richtxt, () => source ? RichText.from(source) : null)
  }

  static from(source: MarkdownOrString): RichText {
    return new RichText(source)
  }

  /**
   * Private constructor to prevent direct instantiation.
   * Use `RichText.from` or `RichText.memoize` instead.
   */
  private constructor(public $source: MarkdownOrString) {}

  /**
   * Returns the text content of the rich text.
   * If the source is a string, it returns the string.
   * If the source is a markdown, it returns the markdown.
   */
  get text(): string {
    if ('txt' in this.$source) {
      return this.$source.txt
    }
    return memoizeProp(this, symb_text, () => markdownToText(this.$source.md!))
  }
}
