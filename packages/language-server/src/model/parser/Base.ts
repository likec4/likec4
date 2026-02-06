import type * as c4 from '@likec4/core'
import {
  type MarkdownOrString,
  exact,
  GlobalFqn,
  isNonEmptyArray,
  nonexhaustive,
  nonNullable,
} from '@likec4/core'
import { type AstNode, type Reference, isAstNode } from 'langium'
import {
  filter,
  flatMap,
  groupBy,
  isArray,
  isBoolean,
  isEmpty,
  isEmptyish,
  isNumber,
  isString,
  isTruthy,
  mapValues,
  pipe,
  unique,
} from 'remeda'
import { dedent } from 'strip-indent'
import { cleanDoubleSlashes, hasLeadingSlash, hasProtocol, isRelative, joinRelativeURL, joinURL } from 'ufo'
import {
  type ParsedElementStyle,
  type ParsedLikeC4LangiumDocument,
  ast,
  parseAstIconPositionValue,
  parseAstOpacityProperty,
  parseAstPercent,
  parseAstSizeValue,
  parseMarkdownAsString,
  toColor,
} from '../../ast'
import { serverLogger } from '../../logger'
import type { LikeC4Services } from '../../module'
import { projectIdFrom } from '../../utils'
import { readStrictFqn } from '../../utils/elementRef'
import { type IsValidFn, checksFromDiagnostics } from '../../validation'
import type { Project } from '../../workspace/ProjectsManager'

const logger = serverLogger.getChild('parser')

// the class which this mixin is applied to
export type GConstructor<T = {}> = new(...args: any[]) => T

export function toSingleLine(str: undefined | null): undefined
export function toSingleLine(str: string): string
export function toSingleLine(str: ast.MarkdownOrString): MarkdownOrString
export function toSingleLine(str: ast.MarkdownOrString | string): MarkdownOrString | string
export function toSingleLine(str: string | undefined | null): string | undefined
export function toSingleLine(str: ast.MarkdownOrString | undefined | null): MarkdownOrString | undefined
export function toSingleLine<S extends ast.MarkdownOrString | string | undefined | null>(str: S): S
export function toSingleLine(str: ast.MarkdownOrString | string | undefined | null) {
  if (str === null || str === undefined) {
    return undefined
  }
  const without = removeIndent(str)
  if (isString(without)) {
    return without.split('\n').join(' ')
  }
  if ('md' in without) {
    return {
      md: without.md.split('\n').join('  '),
    }
  }
  return {
    txt: without.txt.split('\n').join(' '),
  }
}

export function removeIndent(str: undefined): undefined
export function removeIndent(str: string): string
export function removeIndent(str: ast.MarkdownOrString): MarkdownOrString
export function removeIndent(str: string | undefined): string | undefined
export function removeIndent(str: ast.MarkdownOrString | undefined): MarkdownOrString | undefined
export function removeIndent(str: ast.MarkdownOrString | string): MarkdownOrString | string
export function removeIndent<S extends ast.MarkdownOrString | string | undefined>(str: S): S
export function removeIndent(str: ast.MarkdownOrString | string | undefined) {
  if (str === null || str === undefined) {
    return undefined
  }
  switch (true) {
    case isString(str):
      return dedent(str).trim()
    case ast.isMarkdownOrString(str) && isString(str.markdown):
      return {
        md: dedent(str.markdown).trim(),
      }
    case ast.isMarkdownOrString(str) && isString(str.text):
      return {
        txt: dedent(str.text).trim(),
      }
    case ast.isMarkdownOrString(str):
      return {
        txt: '',
      }
    default:
      return undefined
  }
}

export type Base = GConstructor<BaseParser>

type ParserLevel =
  | 'base'
  | 'model'
  | 'deployment'
  | 'fqnref'
  | 'relation'
  | 'views'
  | 'globals'
  | 'imports'
  | 'specification'

export class BaseParser {
  isValid: IsValidFn

  constructor(
    public readonly services: LikeC4Services,
    public readonly doc: ParsedLikeC4LangiumDocument,
    public readonly project: Project,
  ) {
    // do nothing
    this.isValid = checksFromDiagnostics(doc).isValid
  }

  logError(
    error: unknown,
    astNode?: AstNode | Reference<AstNode>,
    level?: ParserLevel,
  ) {
    // dprint-ignore
    let message = error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : String(error)

    if (isAstNode(astNode)) {
      let name = this.services.references.NameProvider.getName(astNode)
      if (name) {
        name = `"${name}" (${astNode.$type})`
      } else {
        name = `${astNode.$type}`
      }

      const cst = astNode.$cstNode
      const position = cst ? `:${cst.range.start.line + 1}:${cst.range.start.character + 1}` : ''
      message += `\n\tat ${name} (${this.doc.uri.fsPath}${position})`
    } else if (astNode && '$refText' in astNode) {
      message += `\n\tat reference "${astNode.$refText}" (${this.doc.uri.fsPath})`
    }
    if (level && level !== 'base') {
      logger.getChild(level).debug(message)
    } else {
      logger.debug(message)
    }
  }

  tryParse<N extends AstNode, T>(
    level: ParserLevel,
    node: N | undefined,
    fn: (node: NoInfer<N>) => T | undefined,
  ): T | undefined {
    try {
      if (!node || !this.isValid(node as any)) {
        return undefined
      }
      return fn(node)
    } catch (e) {
      this.logError(e, node, level)
      return undefined
    }
  }

  tryMap<N extends AstNode, T>(level: ParserLevel, iterable: ReadonlyArray<N>, fn: (node: N) => T | undefined): T[] {
    return flatMap(iterable, node => this.tryParse(level, node, fn) ?? [])
  }

  resolveFqn(node: ast.FqnReferenceable): c4.Fqn {
    if (ast.isImported(node)) {
      const project = projectIdFrom(node)
      const fqn = this.resolveFqn(
        nonNullable(node.imported.ref, `FqnRef is empty of imported: ${node.$cstNode?.text}`),
      )
      this.doc.c4Imports.set(project, fqn)
      return GlobalFqn(project, fqn)
    }
    if (ast.isExtendElement(node)) {
      return readStrictFqn(node.element)
    }
    if (ast.isExtendDeployment(node)) {
      return readStrictFqn(node.deploymentNode)
    }
    if (ast.isDeploymentElement(node)) {
      return this.services.likec4.DeploymentsIndex.getFqn(node)
    }
    return this.services.likec4.FqnIndex.getFqn(node)
  }

  getAstNodePath(node: AstNode) {
    return this.services.workspace.AstNodeLocator.getAstNodePath(node)
  }

  getMetadata(metadataAstNode: ast.MetadataProperty | undefined): { [key: string]: string | string[] } | undefined {
    if (!metadataAstNode || !this.isValid(metadataAstNode) || isEmpty(metadataAstNode.props)) {
      return undefined
    }

    // Helper function to extract string values from MetadataValue
    const extractValues = (value: ast.MetadataValue): string[] => {
      if (ast.isMarkdownOrString(value)) {
        const mdOrStr = removeIndent(value)
        if (!mdOrStr) return []

        // Handle both string and MarkdownOrString types
        if (typeof mdOrStr === 'string') {
          return isTruthy(mdOrStr) ? [mdOrStr] : []
        } else {
          // MarkdownOrString object with txt or md property
          const strValue = mdOrStr.md || mdOrStr.txt
          return isTruthy(strValue) ? [strValue] : []
        }
      } else if (ast.isMetadataArray(value)) {
        return value.values
          .map(v => removeIndent(v))
          .map(v => {
            if (typeof v === 'string') {
              return v
            } else {
              // MarkdownOrString object
              return v.md || v.txt
            }
          })
          .filter(isTruthy)
      }
      return []
    }

    // Transform metadata attributes into key-value pairs
    const keyValuePairs = pipe(
      metadataAstNode.props,
      flatMap(p => extractValues(p.value).map(v => [p.key, v] as [string, string])),
      filter(([_, value]) => isTruthy(value)),
    )

    if (isEmpty(keyValuePairs)) {
      return undefined
    }

    // Group by key to handle duplicate keys
    const groupedData = pipe(
      keyValuePairs,
      groupBy(([key]) => key),
      mapValues(pairs => pairs.map(([_, value]) => value)),
    )

    // Convert to final format: single values as string, multiple values as string[]
    const data: { [key: string]: string | string[] } = {}
    for (const [key, values] of Object.entries(groupedData)) {
      if (values && values.length > 0) {
        data[key] = values.length === 1 ? values[0]! : values
      }
    }

    return isEmpty(data) ? undefined : data
  }

  parseMarkdownOrString(markdownOrString: ast.MarkdownOrString | undefined): c4.MarkdownOrString | undefined {
    if (ast.isMarkdownOrString(markdownOrString)) {
      return removeIndent(markdownOrString)
    }
    return undefined
  }

  convertTags<E extends { tags?: ast.Tags }>(withTags?: E) {
    return this.parseTags(withTags)
  }
  parseTags<E extends { tags?: ast.Tags }>(withTags?: E): c4.NonEmptyArray<c4.Tag> | null {
    let iter = withTags?.tags
    if (!iter) {
      return null
    }
    let tags = [] as c4.Tag[]
    while (iter) {
      tags.push(
        ...this.tryMap(
          'base',
          iter.values,
          t => nonNullable(t.tag.ref, `Tag reference is not resolved`).name as c4.Tag,
        ).filter(isTruthy),
      )
      iter = iter.prev
    }
    return isNonEmptyArray(tags) ? unique(tags) : null
  }

  convertLinks(source?: ast.LinkProperty['$container']): c4.NonEmptyArray<c4.Link> | undefined {
    return this.parseLinks(source)
  }
  parseLinks(source?: ast.LinkProperty['$container']): c4.NonEmptyArray<c4.Link> | undefined {
    if (!source?.props || source.props.length === 0) {
      return undefined
    }
    const links = this.tryMap(
      'base',
      filter(source.props, ast.isLinkProperty),
      p => {
        const url = p.value
        if (isEmptyish(url)) {
          return undefined
        }
        const title = isTruthy(p.title) ? toSingleLine(p.title) : undefined
        const relative = this.services.lsp.DocumentLinkProvider.relativeLink(this.doc, url)
        return exact({
          url,
          title,
          relative: relative && relative !== url ? relative : undefined,
        }) as c4.Link
      },
    )
    return isNonEmptyArray(links) ? links : undefined
  }

  parseIconProperty(prop: ast.IconProperty | undefined): c4.IconUrl | undefined {
    if (!prop || !this.isValid(prop)) {
      return undefined
    }
    const { libicon, value } = prop
    switch (true) {
      case !!libicon: {
        const name = libicon.ref?.name
        if (!name) {
          this.logError(`Library icon ${libicon.$refText} is not a valid library icon`, prop)
          return undefined
        }
        return name as c4.IconUrl
      }
      case value && value === 'none': {
        return value as c4.IconUrl
      }
      case value && hasProtocol(value): {
        if (value.startsWith('file:')) {
          this.logError(`Icon property '${value}' used the 'file' protocol which is not supported`, prop)
          return undefined
        }

        return value as c4.IconUrl
      }
      case value && value.startsWith('@'): {
        return this.parseImageAlias(value) as c4.IconUrl
      }
      case value && isRelative(value): {
        return joinRelativeURL(this.doc.uri.toString(), '../', value) as c4.IconUrl
      }
      case value && hasLeadingSlash(value): {
        return joinURL(this.project.folderUri.toString(), value) as c4.IconUrl
      }
      default: {
        this.logError(`Icon property '${value}' is not a valid URL, library icon, image alias or 'none'`, prop)
        return undefined
      }
    }
  }

  parseImageAlias(value: string): string | undefined {
    // Extract the alias name (e.g., '@infra' from '@infra/backend.svg')
    const slashIndex = value.indexOf('/')
    const aliasName = slashIndex > 0 ? value.substring(0, slashIndex) : value
    const remainingPath = slashIndex > 0 ? value.substring(slashIndex + 1) : ''
    // Get imageAliases from project config, or use default '@' -> './images' mapping
    const imageAliases: Record<string, string> = { '@': './images', ...this.project.config.imageAliases }

    // Look up the alias path
    const aliasPath = imageAliases[aliasName]
    if (!aliasPath) {
      logger.warn(`Image alias "${aliasName}" not found in project configuration`)
      return undefined
    }

    // Combine the alias path with the remaining path
    const fullPath = remainingPath ? joinURL(aliasPath, remainingPath) : aliasPath

    // Make it relative to the **project root**, not the current document.
    return joinURL(this.project.folderUri.toString(), fullPath)
  }

  parseColorLiteral(astNode: ast.ColorLiteral): c4.ColorLiteral | undefined {
    if (!this.isValid(astNode)) {
      return undefined
    }
    if (ast.isHexColor(astNode)) {
      return `#${astNode.hex}`
    }
    if (ast.isRGBAColor(astNode)) {
      let alpha = isNumber(astNode.alpha) ? astNode.alpha : undefined
      if (isString(astNode.alpha)) {
        alpha = parseAstPercent(astNode.alpha) / 100
      }

      if (alpha !== undefined) {
        return `rgba(${astNode.red},${astNode.green},${astNode.blue},${alpha})`
      }

      return `rgb(${astNode.red},${astNode.green},${astNode.blue})`
    }
    nonexhaustive(astNode)
  }

  parseElementStyle(
    elementProps: Array<ast.ElementProperty> | ast.ElementStyleProperty | undefined,
  ): ParsedElementStyle {
    if (!elementProps) {
      return {} as ParsedElementStyle
    }
    if (isArray(elementProps)) {
      const style = this.parseStyleProps(elementProps.find(ast.isElementStyleProperty)?.props)
      // Property on element has higher priority than from style
      try {
        const iconProp = this.parseIconProperty(elementProps.find(ast.isIconProperty))
        if (iconProp) {
          style.icon = iconProp
        }
      } catch (err) {
        this.logError(err)
      }
      return style
    }
    return this.parseStyleProps(elementProps.props)
  }

  parseStyleProps(styleProps: Array<ast.StyleProperty> | undefined): ParsedElementStyle {
    const result = {} as ParsedElementStyle
    if (!styleProps || styleProps.length === 0) {
      return result
    }
    for (const prop of styleProps) {
      if (!this.isValid(prop)) {
        continue
      }
      try {
        switch (true) {
          case ast.isBorderProperty(prop): {
            if (isTruthy(prop.value)) {
              result.border = prop.value
            }
            break
          }
          case ast.isColorProperty(prop): {
            const color = toColor(prop)
            if (isTruthy(color)) {
              result.color = color
            }
            break
          }
          case ast.isShapeProperty(prop): {
            if (isTruthy(prop.value)) {
              result.shape = prop.value
            }
            break
          }
          case ast.isIconProperty(prop): {
            const icon = this.parseIconProperty(prop)
            if (isTruthy(icon)) {
              result.icon = icon
            }
            break
          }
          case ast.isIconColorProperty(prop): {
            const color = toColor(prop)
            if (isTruthy(color)) {
              result.iconColor = color
            }
            break
          }
          case ast.isIconSizeProperty(prop): {
            if (isTruthy(prop.value)) {
              result.iconSize = parseAstSizeValue(prop)
            }
            break
          }
          case ast.isIconPositionProperty(prop): {
            if (isTruthy(prop.value)) {
              result.iconPosition = parseAstIconPositionValue(prop)
            }
            break
          }
          case ast.isOpacityProperty(prop): {
            result.opacity = parseAstOpacityProperty(prop)
            break
          }
          case ast.isMultipleProperty(prop): {
            result.multiple = isBoolean(prop.value) ? prop.value : false
            break
          }
          case ast.isShapeSizeProperty(prop): {
            if (isTruthy(prop.value)) {
              result.size = parseAstSizeValue(prop)
            }
            break
          }
          case ast.isPaddingSizeProperty(prop): {
            if (isTruthy(prop.value)) {
              result.padding = parseAstSizeValue(prop)
            }
            break
          }
          case ast.isTextSizeProperty(prop): {
            if (isTruthy(prop.value)) {
              result.textSize = parseAstSizeValue(prop)
            }
            break
          }
          default:
            nonexhaustive(prop)
        }
      } catch (err) {
        this.logError(err, prop)
      }
    }
    return exact(result)
  }

  /**
   * Parse base properties: title, description and technology
   *
   * @param props - body properties (inside '{...}')
   * @param override - optional, inline properties (right on the node)
   *                   have higher priority and override body properties
   */
  parseBaseProps(
    props: {
      title?: ast.MarkdownOrString | undefined
      summary?: ast.MarkdownOrString | undefined
      description?: ast.MarkdownOrString | undefined
      technology?: ast.MarkdownOrString | undefined
    },
    override?: {
      title?: string | undefined
      summary?: string | undefined
      description?: string | undefined
      technology?: string | undefined
    },
  ): {
    title?: string
    summary?: c4.MarkdownOrString
    description?: c4.MarkdownOrString
    technology?: string
  } {
    const title = removeIndent(override?.title ?? parseMarkdownAsString(props.title))

    const description = override?.description
      ? { txt: removeIndent(override.description) }
      : this.parseMarkdownOrString(props.description)

    const summary = override?.summary
      ? { txt: removeIndent(override.summary) }
      : this.parseMarkdownOrString(props.summary)

    const technology = toSingleLine(override?.technology) ??
      removeIndent(parseMarkdownAsString(props.technology))

    return exact({
      title,
      summary,
      description,
      technology,
    })
  }
}
