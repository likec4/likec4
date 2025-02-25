import type * as c4 from '@likec4/core'
import { isNonEmptyArray } from '@likec4/core'
import type { AstNode } from 'langium'
import { filter, flatMap, fromEntries, isEmpty, isNonNullish, isTruthy, map, pipe, unique } from 'remeda'
import stripIndent from 'strip-indent'
import { type ParsedLikeC4LangiumDocument, ast } from '../../ast'
import type { LikeC4Services } from '../../module'
import { readStrictFqn } from '../../utils/elementRef'
import { type IsValidFn, checksFromDiagnostics } from '../../validation'

// the class which this mixin is applied to
export type GConstructor<T = {}> = new(...args: any[]) => T

export function toSingleLine<T extends string | undefined | null>(str: T): T {
  return (isNonNullish(str) ? removeIndent(str).split('\n').join(' ') : undefined) as T
}

export function removeIndent<T extends string | undefined | null>(str: T): T {
  return (isNonNullish(str) ? stripIndent(str).trim() : undefined) as T
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

  resolveFqn(node: ast.FqnReferenceable): c4.Fqn {
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
          const values = iter.values.map(t => t.ref?.name).filter(isTruthy) as c4.Tag[]
          if (values.length > 0) {
            tags.push(...values)
          }
        }
      } catch (e) {
        // ignore
      }
      iter = iter.prev
    }
    tags = unique(tags.reverse())
    return isNonEmptyArray(tags) ? tags : null
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
}
