import type { MarkdownOrString } from './scalar';
export interface RichTextEmpty {
    readonly isEmpty: true;
    readonly isMarkdown: false;
    readonly nonEmpty: false;
    readonly $source: null;
    readonly text: null;
    readonly md: null;
    readonly html: null;
    equals(other: unknown): boolean;
}
export interface RichTextNonEmpty {
    readonly isEmpty: false;
    readonly nonEmpty: true;
    readonly isMarkdown: boolean;
    readonly $source: MarkdownOrString;
    readonly text: string;
    readonly md: string;
    readonly html: string;
    equals(other: unknown): boolean;
}
export type RichTextOrEmpty = RichTextNonEmpty | RichTextEmpty;
/**
 * RichText is a class that represents a potentially markdown string.
 * It can be either a plain text or a markdown.
 * It is used to represent the content of a node or a link.
 */
export declare class RichText {
    private static mdcache;
    private static txtcache;
    private static getOrCreateFromText;
    private static getOrCreateFromMarkdown;
    /**
     * Creates and memoizes a RichText instance.
     * @see ElementModel.description
     * @example
     *
     *  get description(): RichTextOrEmpty {
     *    return RichText.memoize(this, 'description', this.$element.description)
     *  }
     */
    static memoize(obj: object, tag: symbol | string, source: MarkdownOrString | null | undefined): RichTextOrEmpty;
    /**
     * Creates a RichText instance from a source.
     */
    static from(source: RichTextOrEmpty | MarkdownOrString | string | null | undefined): RichTextOrEmpty;
    /**
     * This is a workaround for the fact that we need instance of RichText for `instanceof` checks
     * It is invalid inheritance (returning `null` from getters), and we cast to @see RichTextEmpty
     */
    static EMPTY: RichTextEmpty;
    readonly $source: Readonly<MarkdownOrString> | null;
    readonly isEmpty: boolean;
    readonly nonEmpty: boolean;
    readonly isMarkdown: boolean;
    /**
     * Private constructor to prevent direct instantiation.
     * Use {@link RichText.from} or {@link RichText.memoize} instead.
     */
    private constructor();
    /**
     * Returns the text content of the rich text.
     * If the source is a string, it returns the string.
     * If the source is a markdown, it returns the markdown.
     */
    get text(): string;
    /**
     * Returns the markdown content of the rich text.
     * If the source is a string, it returns the string.
     * If the source is a markdown, it returns the markdown.
     */
    get md(): string;
    /**
     * Returns the html content of the rich text.
     * If the source is a string, it returns the string.
     * If the source is a markdown, it returns the HTML.
     */
    get html(): string;
    equals(other: unknown): boolean;
}
