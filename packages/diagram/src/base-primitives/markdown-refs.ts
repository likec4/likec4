import type { LikeC4Model } from '@likec4/core/model'
import type { Fqn, RichTextOrEmpty, ViewId } from '@likec4/core/types'

/**
 * Ref anchor, as rendered by `markdownToHtml` from `@likec4/core`:
 * `<a data-likec4-ref="<target>" data-likec4-ref-kind="<kind>" [data-likec4-ref-namespace="<ns>"] [data-likec4-ref-label]>label or target</a>`
 */
export type MarkdownRefAnchor = {
  kind: 'element' | 'view' | 'unknown'
  /**
   * Element FQN or view id (decoded)
   */
  target: string
  /**
   * Namespace (decoded): 'view', an unknown prefix, or null
   */
  namespace: string | null
  /**
   * True if the author wrote a label (`[[target|label]]`)
   */
  hasLabel: boolean
}

/**
 * Content of the hover card of a resolved ref
 */
export type MarkdownRefPreview = {
  title: string
  /**
   * Secondary line: element kind and technology, or view type
   */
  meta: string
  /**
   * Element summary (or description), view description
   */
  body: RichTextOrEmpty
}

export type ResolvedMarkdownRef =
  /**
   * Target exists and can be opened (element details or navigation)
   */
  | { state: 'link'; kind: 'element'; fqn: Fqn; text: string; preview: MarkdownRefPreview }
  | { state: 'link'; kind: 'view'; viewId: ViewId; text: string; preview: MarkdownRefPreview }
  /**
   * Target exists, but opening it is not available (canvas, disabled feature, or no model)
   */
  | { state: 'text'; text: string }
  /**
   * Target does not exist, or the namespace is unknown
   */
  | { state: 'missing'; text: null; message: string }

export type MarkdownRefResolver = (ref: MarkdownRefAnchor) => ResolvedMarkdownRef

export type MarkdownRefResolverOptions = {
  /**
   * Element refs are links (open element details)
   */
  elements: boolean
  /**
   * View refs are links (navigate to view)
   */
  views: boolean
}

/**
 * Creates a resolver of Markdown refs against the model.
 * Without a model, every ref is rendered as is (fallback text), without links.
 */
export function createMarkdownRefResolver(
  model: LikeC4Model | null,
  options: MarkdownRefResolverOptions,
): MarkdownRefResolver {
  return ref => {
    switch (true) {
      case ref.kind === 'element': {
        if (!model) {
          return { state: 'text', text: ref.target }
        }
        const element = model.findElement(ref.target)
        if (!element) {
          return { state: 'missing', text: null, message: `Element '${ref.target}' not found` }
        }
        const text = element.title
        if (!options.elements) {
          return { state: 'text', text }
        }
        return {
          state: 'link',
          kind: 'element',
          fqn: element.id,
          text,
          preview: {
            title: element.title,
            meta: element.technology ? `${element.kind} · ${element.technology}` : element.kind,
            body: element.summary,
          },
        }
      }
      case ref.kind === 'view': {
        if (!model) {
          return { state: 'text', text: ref.target }
        }
        const view = model.findView(ref.target)
        if (!view) {
          return { state: 'missing', text: null, message: `View '${ref.target}' not found` }
        }
        const text = view.titleOrId
        if (!options.views) {
          return { state: 'text', text }
        }
        return {
          state: 'link',
          kind: 'view',
          viewId: view.id,
          text,
          preview: {
            title: text,
            meta: `${view._type} view`,
            body: view.description,
          },
        }
      }
      default: {
        return {
          state: 'missing',
          text: null,
          message: ref.namespace !== null
            ? `Unknown link type '${ref.namespace}:'`
            : `Unknown link type for '${ref.target}'`,
        }
      }
    }
  }
}

/**
 * Matches ref anchors in the sanitized HTML from `markdownToHtml`.
 * Attribute values never contain `"` (encoded as `&#x22;`) and text never contains `<` (encoded as `&#x3C;`).
 * The anchor has only a text child: refs never contain markup.
 */
const refAnchorRe =
  /<a data-likec4-ref="([^"]*)" data-likec4-ref-kind="(element|view|unknown)"(?: data-likec4-ref-namespace="([^"]*)")?( data-likec4-ref-label)?>([^<]*)<\/a>/g

const namedEntities: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: '\'',
}

function decodeEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (match, entity: string) => {
    switch (true) {
      case entity[0] === '#': {
        const codePoint = entity[1] === 'x' || entity[1] === 'X'
          ? Number.parseInt(entity.slice(2), 16)
          : Number.parseInt(entity.slice(1), 10)
        return Number.isNaN(codePoint) ? match : String.fromCodePoint(codePoint)
      }
      default:
        return namedEntities[entity.toLowerCase()] ?? match
    }
  })
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&#39;')
}

/**
 * Parses the ref attributes of an element (used by event handlers).
 */
export function parseMarkdownRefAnchor(el: Element): MarkdownRefAnchor | null {
  const target = el.getAttribute('data-likec4-ref')
  const kind = el.getAttribute('data-likec4-ref-kind')
  if (target === null || (kind !== 'element' && kind !== 'view' && kind !== 'unknown')) {
    return null
  }
  return {
    target,
    kind,
    namespace: el.getAttribute('data-likec4-ref-namespace'),
    hasLabel: el.hasAttribute('data-likec4-ref-label'),
  }
}

/**
 * Replaces ref anchors in the HTML rendered by `markdownToHtml` with resolved refs:
 * - link: `<a role="link" tabindex="0" data-likec4-ref-state="link">title or label</a>`
 * - text: `<span data-likec4-ref-state="text">title or label</span>`
 * - missing: `<span data-likec4-ref-state="missing">label or target</span>`
 *
 * Original `data-likec4-ref*` attributes are kept, so event handlers can read the target.
 * Titles are HTML-escaped; labels are kept as they were encoded by `markdownToHtml`.
 */
export function resolveMarkdownRefs(html: string, resolve: MarkdownRefResolver): string {
  if (!html.includes('data-likec4-ref')) {
    return html
  }
  return html.replace(
    refAnchorRe,
    (
      _match,
      rawTarget: string,
      kind: MarkdownRefAnchor['kind'],
      rawNamespace: string | undefined,
      label: string | undefined,
      rawText: string,
    ) => {
      const hasLabel = !!label
      const resolved = resolve({
        target: decodeEntities(rawTarget),
        kind,
        namespace: rawNamespace !== undefined ? decodeEntities(rawNamespace) : null,
        hasLabel,
      })
      const text = hasLabel || resolved.text === null ? rawText : escapeHtml(resolved.text)
      const attrs = `data-likec4-ref="${rawTarget}" data-likec4-ref-kind="${kind}"`
        + (rawNamespace !== undefined ? ` data-likec4-ref-namespace="${rawNamespace}"` : '')
        + (hasLabel ? ' data-likec4-ref-label' : '')
      if (resolved.state === 'link') {
        return `<a ${attrs} data-likec4-ref-state="link" role="link" tabindex="0">${text}</a>`
      }
      return `<span ${attrs} data-likec4-ref-state="${resolved.state}">${text}</span>`
    },
  )
}
