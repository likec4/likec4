import type { MarkdownOrString } from '../types'
import { memoizeProp } from '../utils'

const richtxt = Symbol.for('richtxt')

export class RichText {
  static memoize(obj: object, source: MarkdownOrString | null | undefined): RichText | null {
    return memoizeProp(obj, richtxt, () => source ? new RichText(source) : null)
  }

  static from(source: MarkdownOrString): RichText {
    return new RichText(source)
  }
  constructor(public $source: MarkdownOrString) {}

  /**
   * Returns the text content of the rich text.
   * If the source is a string, it returns the string.
   * If the source is a markdown, it returns the markdown.
   */
  get text(): string {
    return this.$source.txt ?? this.$source.md
  }
}
