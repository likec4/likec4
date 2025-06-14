import type * as c4 from '@likec4/core'
import { type MarkdownOrString, GlobalFqn, isNonEmptyArray, nonexhaustive, nonNullable } from '@likec4/core'
import type { AstNode, URI } from 'langium'
import {
  filter,
  flatMap,
  fromEntries,
  isArray,
  isBoolean,
  isEmpty,
  isNumber,
  isString,
  isTruthy,
  map,
  pipe,
  unique,
} from 'remeda'
import stripIndent from 'strip-indent'
import { hasLeadingSlash, hasProtocol, isRelative, joinRelativeURL, joinURL } from 'ufo'
import {
  type ParsedElementStyle,
  type ParsedLikeC4LangiumDocument,
  ast,
  parseAstOpacityProperty,
  parseAstPercent,
  parseAstSizeValue,
  toColor,
} from '../../ast'
import type { ProjectConfig } from '../../config'
import type { LikeC4Services } from '../../module'
import { projectIdFrom } from '../../utils'
import { readStrictFqn } from '../../utils/elementRef'
import { type IsValidFn, checksFromDiagnostics } from '../../validation'

// the class which this mixin is applied to
export type GConstructor<T = {}> = new(...args: any[]) => T

export function toSingleLine(str: string): string
export function toSingleLine(str: ast.MarkdownOrString): MarkdownOrString
export function toSingleLine(str: string | undefined | null): string | undefined
export function toSingleLine(str: ast.MarkdownOrString | string | undefined | null): MarkdownOrString | undefined
export function toSingleLine(str: ast.MarkdownOrString | string | undefined | null): MarkdownOrString | undefined {
  if (str === null || str === undefined) {
    return undefined
  }
  const without = removeIndent(str)
  if (isString(without)) {
    return without.split('\n').join(' ')
  }
  return {
    md: without.md.split('\n').join(' '),
  }
}

export function removeIndent(str: string): string
export function removeIndent(str: ast.MarkdownOrString | string): MarkdownOrString
export function removeIndent(str: string | undefined | null): string | undefined
export function removeIndent(str: ast.MarkdownOrString | string | undefined | null): MarkdownOrString | undefined
export function removeIndent(str: ast.MarkdownOrString | string | undefined | null): MarkdownOrString | undefined {
  if (str === null || str === undefined) {
    return undefined
  }
  switch (true) {
    case isString(str):
      return stripIndent(str).trim()
    case ast.isMarkdownOrString(str) && !!str.markdown:
      return {
        md: stripIndent(str.markdown).trim(),
      }
    case ast.isMarkdownOrString(str) && !!str.text:
      return stripIndent(str.text).trim()
    default:
      return undefined
  }
}

export type Base = GConstructor<BaseParser>

export class BaseParser {
  isValid: IsValidFn

  constructor(
    public readonly services: LikeC4Services,
    public readonly doc: ParsedLikeC4LangiumDocument,
  ) {
    // do nothing
    this.isValid = checksFromDiagnostics(doc).isValid
  }

  get project(): {
    id: c4.ProjectId
    folder: URI
    config: Readonly<ProjectConfig>
  } {
    return this.services.shared.workspace.ProjectsManager.getProject(this.doc)
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

  getMetadata(metadataAstNode: ast.MetadataProperty | undefined): { [key: string]: string } | undefined {
    if (!metadataAstNode || !this.isValid(metadataAstNode) || isEmpty(metadataAstNode.props)) {
      return undefined
    }
    const data = pipe(
      metadataAstNode.props,
      map(p => [p.key, removeIndent(p.value)] as [string, string]),
      filter(([_, value]) => isTruthy(value)),
      fromEntries(),
    )
    return isEmpty(data) ? undefined : data
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
      try {
        if (this.isValid(iter)) {
          const values = iter.values.map(t => t.tag.ref?.name).filter(isTruthy) as c4.Tag[]
          if (values.length > 0) {
            tags.push(...values)
          }
        }
      } catch (e) {
        // ignore
      }
      iter = iter.prev
    }
    return isNonEmptyArray(tags) ? unique(tags) : null
  }

  convertLinks(source?: ast.LinkProperty['$container']): c4.Link[] | undefined {
    return this.parseLinks(source)
  }
  parseLinks(source?: ast.LinkProperty['$container']): c4.Link[] | undefined {
    if (!source?.props || source.props.length === 0) {
      return undefined
    }
    return pipe(
      source.props,
      filter(ast.isLinkProperty),
      flatMap(p => {
        if (!this.isValid(p)) {
          return []
        }
        const url = p.value
        if (isTruthy(url)) {
          const title = isTruthy(p.title) ? toSingleLine(p.title) : undefined
          const relative = this.services.lsp.DocumentLinkProvider.relativeLink(this.doc, url)
          return {
            url,
            ...(title && { title }),
            ...(relative && relative !== url && { relative }),
          }
        }
        return []
      }),
    )
  }

  parseIconProperty(prop: ast.IconProperty | undefined): c4.IconUrl | undefined {
    if (!prop || !this.isValid(prop)) {
      return undefined
    }
    const { libicon, value } = prop
    switch (true) {
      case !!libicon: {
        return libicon.ref?.name as c4.IconUrl
      }
      case value && value === 'none': {
        return value as c4.IconUrl
      }
      case value && hasProtocol(value): {
        if (value.startsWith('file:')) {
          return undefined
        }

        return value as c4.IconUrl
      }
      case value && isRelative(value): {
        return joinRelativeURL(this.doc.uri.toString(), '../', value) as c4.IconUrl
      }
      case value && hasLeadingSlash(value): {
        return joinURL(this.project.folder.toString(), value) as c4.IconUrl
      }
      default: {
        return undefined
      }
    }
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
      const style = this.parseStyleProps(elementProps?.find(ast.isElementStyleProperty)?.props)
      // Property on element has higher priority than from style
      const iconProp = this.parseIconProperty(elementProps?.find(ast.isIconProperty))
      if (iconProp) {
        style.icon = iconProp
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
    }
    return result
  }
}
