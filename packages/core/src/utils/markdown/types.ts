/**
 * Link to a model element or view, found in a Markdown value:
 * `[[fqn]]`, `[[fqn|label]]`, `[[view:id]]`
 */
export type MarkdownRef = {
  kind: 'element' | 'view' | 'unknown'
  /**
   * 'view', an unknown prefix, or null
   */
  namespace: string | null
  /**
   * Target without namespace (FQN for elements, view id for views)
   */
  target: string
  /**
   * Custom label (trimmed, escapes decoded), null if not specified or empty
   */
  label: string | null
  /**
   * The whole `[[…]]`, offsets in the parsed Markdown string
   */
  range: { start: number; end: number }
  /**
   * Target only (without namespace and label), offsets in the parsed Markdown string
   */
  targetRange: { start: number; end: number }
}

/**
 * Resolves the text a ref is displayed with: the element title, or the view title.
 * Returns null if the target is not found (or the namespace is unknown),
 * then the ref falls back to its target.
 *
 * Not called for refs with a custom label, the label always wins.
 */
export type MarkdownRefTitleResolver = (ref: MarkdownRef) => string | null
