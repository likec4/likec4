import {
  type MarkdownRefTitleResolver,
  markdownToHtml,
  markdownToText,
  memoizeProp,
  nonexhaustive,
} from '../utils'
import { LRUMap } from '../utils/mnemonist'
import type { MarkdownOrString } from './scalar'

const symb_text = Symbol.for('text')
const symb_html = Symbol.for('html')

const emptyTxt = ''

export interface RichTextEmpty {
  readonly isEmpty: true
  readonly isMarkdown: false
  readonly nonEmpty: false
  readonly $source: null
  readonly text: null
  readonly md: null
  readonly html: null
  equals(other: unknown): boolean
}

export interface RichTextNonEmpty {
  readonly isEmpty: false
  readonly nonEmpty: true
  readonly isMarkdown: boolean
  readonly $source: MarkdownOrString
  readonly text: string
  readonly md: string
  readonly html: string
  equals(other: unknown): boolean
}

export type RichTextOrEmpty = RichTextNonEmpty | RichTextEmpty

/**
 * RichText is a class that represents a potentially markdown string.
 * It can be either a plain text or a markdown.
 * It is used to represent the content of a node or a link.
 */
export class RichText {
  // Keep 500 last converted markdown/html texts in memory
  private static mdcache = new LRUMap<string, RichTextOrEmpty>(500)
  private static txtcache = new LRUMap<string, RichTextOrEmpty>(500)

  private static getOrCreateFromText(txt: string): RichTextOrEmpty {
    txt = txt.trimEnd()
    if (txt === emptyTxt) {
      return RichText.EMPTY
    }
    let cached = RichText.txtcache.get(txt)
    if (cached) {
      return cached
    }
    cached = new RichText({ txt }) as RichTextOrEmpty
    RichText.txtcache.set(txt, cached)
    return cached
  }

  private static getOrCreateFromMarkdown(md: string): RichTextOrEmpty {
    md = md.trimEnd()
    if (md === emptyTxt) {
      return RichText.EMPTY
    }
    let cached = RichText.mdcache.get(md)
    if (cached) {
      return cached
    }
    cached = new RichText({ md }) as RichTextOrEmpty
    RichText.mdcache.set(md, cached)
    return cached
  }

  /**
   * Creates and memoizes a RichText instance on the given object.
   * With `resolveRef`, refs in Markdown (`[[fqn]]`, `[[view:id]]`) are resolved, see {@link RichText.from}
   * @see ElementModel.description
   * @example
   *
   *  get description(): RichTextOrEmpty {
   *    return RichText.memoize(this, 'description', this.$element.description, this.$model.resolveMarkdownRef)
   *  }
   */
  static memoize(
    obj: object,
    tag: symbol | string,
    source: MarkdownOrString | null | undefined,
    resolveRef?: MarkdownRefTitleResolver,
  ): RichTextOrEmpty {
    return memoizeProp(obj, tag, () => RichText.from(source, resolveRef))
  }

  /**
   * Creates a RichText instance from a source.
   *
   * Instances are cached by source (shared LRU cache).
   *
   * With `resolveRef`, refs in Markdown (`[[fqn]]`, `[[view:id]]`) get their titles from the resolver
   * in {@link RichText.text} and {@link RichText.html}.
   * Such instance depends on the resolver and is not cached (memoize it on the owner, see {@link RichText.memoize}).
   * Markdown without refs returns the cached instance.
   */
  static from(
    source: RichTextOrEmpty | MarkdownOrString | string | null | undefined,
    resolveRef?: MarkdownRefTitleResolver,
  ): RichTextOrEmpty {
    if (source === null || source === undefined || source === RichText.EMPTY) {
      return RichText.EMPTY
    }
    if (resolveRef) {
      const md = getMarkdown(source)
      if (md !== null && md.includes('[[')) {
        return RichTextWithRefs.create(md, resolveRef)
      }
    }
    if (source instanceof RichText) {
      return source as RichTextOrEmpty
    }
    if (typeof source === 'string') {
      return this.getOrCreateFromText(source)
    }
    if ('isEmpty' in source && source.isEmpty) {
      return RichText.EMPTY
    }
    if ('md' in source) {
      return this.getOrCreateFromMarkdown(source.md)
    }
    return this.getOrCreateFromText(source.txt)
  }

  /**
   * This is a workaround for the fact that we need instance of RichText for `instanceof` checks
   * It is invalid inheritance (returning `null` from getters), and we cast to @see RichTextEmpty
   */
  static EMPTY: RichTextEmpty = new class extends RichText {
    public override readonly isEmpty: true = true
    public override readonly nonEmpty: false = false
    public override readonly isMarkdown: false = false
    public override readonly $source: null = null
    constructor() {
      super({ txt: emptyTxt })
    }

    override get text(): any {
      return null
    }

    override get md(): any {
      return null
    }

    override get html(): any {
      return null
    }
  }()

  public readonly $source: Readonly<MarkdownOrString> | null

  public readonly isEmpty: boolean
  public readonly nonEmpty: boolean
  public readonly isMarkdown: boolean

  /**
   * Protected constructor to prevent direct instantiation.
   * Use {@link RichText.from} or {@link RichText.memoize} instead.
   */
  protected constructor(source: MarkdownOrString | string) {
    this.isMarkdown = false
    if (typeof source === 'string') {
      this.$source = { txt: source }
      this.isEmpty = source.trim() === emptyTxt
    } else {
      this.$source = source
      this.isEmpty = true
      if ('md' in source) {
        this.isEmpty = source.md === emptyTxt
        this.isMarkdown = true
      } else {
        this.isEmpty = source.txt === emptyTxt
      }
    }
    this.nonEmpty = !this.isEmpty
  }

  /**
   * Returns the text content of the rich text.
   * If the source is a string, it returns the string.
   * If the source is a markdown, it returns the markdown.
   */
  get text(): string {
    if (this.isEmpty || this.$source === null) {
      return emptyTxt
    }
    const source = this.$source
    if ('txt' in source) {
      return source.txt
    }
    return memoizeProp(this, symb_text, () => markdownToText(source.md!))
  }

  /**
   * Returns the markdown content of the rich text.
   * If the source is a string, it returns the string.
   * If the source is a markdown, it returns the markdown.
   */
  get md(): string {
    if (this.isEmpty || this.$source === null) {
      return emptyTxt
    }
    const source = this.$source
    if ('md' in source) {
      return source.md
    }
    if ('txt' in source) {
      return source.txt
    }
    nonexhaustive(source)
  }

  /**
   * Returns the html content of the rich text.
   * If the source is a string, it returns the string.
   * If the source is a markdown, it returns the HTML.
   */
  get html(): string {
    if (this.isEmpty || this.$source === null) {
      return emptyTxt
    }
    const source = this.$source
    if ('txt' in source) {
      return source.txt
    }
    return memoizeProp(this, symb_html, () => markdownToHtml(source.md!))
  }

  equals(other: unknown): boolean {
    if (this === other) return true
    if (!(other instanceof RichText)) return false
    if (this.isEmpty && other.isEmpty) return true
    if (this.isEmpty !== other.isEmpty || this.isMarkdown !== other.isMarkdown) return false

    if (this.isMarkdown) {
      return this.$source?.md === other.$source?.md
    }
    return this.$source?.txt === other.$source?.txt
  }
}

/**
 * Returns the Markdown of the source, or null if the source is not Markdown (or empty)
 */
function getMarkdown(source: RichTextOrEmpty | MarkdownOrString | string): string | null {
  if (typeof source === 'string') {
    return null
  }
  if (source instanceof RichText) {
    return source.isMarkdown ? source.md : null
  }
  if ('isEmpty' in source) {
    return source.nonEmpty && source.isMarkdown ? source.md : null
  }
  return 'md' in source ? source.md : null
}

/**
 * RichText with refs resolved by the resolver (usually bound to the model):
 * {@link RichText.text} and {@link RichText.html} show the titles instead of the targets.
 *
 * Everything else ({@link RichText.md}, {@link RichText.$source}, {@link RichText.equals}, emptiness)
 * is source-based, as in RichText.
 */
class RichTextWithRefs extends RichText {
  static create(md: string, resolveRef: MarkdownRefTitleResolver): RichTextOrEmpty {
    md = md.trimEnd()
    if (md === emptyTxt) {
      return RichText.EMPTY
    }
    return new RichTextWithRefs(md, resolveRef) as RichTextOrEmpty
  }

  private constructor(md: string, private readonly resolveRef: MarkdownRefTitleResolver) {
    super({ md })
  }

  override get text(): string {
    return memoizeProp(this, symb_text, () => markdownToText(this.md, this.resolveRef))
  }

  override get html(): string {
    return memoizeProp(this, symb_html, () => markdownToHtml(this.md, this.resolveRef))
  }
}
