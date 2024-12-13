import type * as c4 from '@likec4/core'
import { invariant, isNonEmptyArray } from '@likec4/core'
import type { AstNode } from 'langium'
import { filter, flatMap, isNonNullish, isNullish, isTruthy, mapToObj, pipe } from 'remeda'
import stripIndent from 'strip-indent'
import { DiagnosticSeverity } from 'vscode-languageserver-types'
import {
  ast,
  type LikeC4AstNode,
  type LikeC4LangiumDocument,
  type ParsedLikeC4LangiumDocument,
  type ParsedLink
} from '../../ast'
import type { LikeC4Services } from '../../module'
import { getFqnElementRef } from '../../utils/elementRef'

// the class which this mixin is applied to
export type GConstructor<T = {}> = new(...args: any[]) => T

export function toSingleLine<T extends string | undefined | null>(str: T): T {
  return (isNonNullish(str) ? removeIndent(str).split('\n').join(' ') : undefined) as T
}

export function removeIndent<T extends string | undefined | null>(str: T): T {
  return (isNonNullish(str) ? stripIndent(str).trim() : undefined) as T
}

export type Base = GConstructor<BaseParser>

type Guard<N extends AstNode> = (n: AstNode) => n is N
type Guarded<G> = G extends Guard<infer N> ? N : never

function validatableAstNodeGuards<const Predicates extends Guard<AstNode>[]>(
  predicates: Predicates
) {
  return (n: AstNode): n is Guarded<Predicates[number]> => predicates.some(p => p(n))
}
const isValidatableAstNode = validatableAstNodeGuards([
  ast.isGlobals,
  ast.isGlobalPredicateGroup,
  ast.isGlobalDynamicPredicateGroup,
  ast.isGlobalStyle,
  ast.isGlobalStyleGroup,
  ast.isDynamicViewPredicateIterator,
  ast.isElementPredicateWith,
  ast.isRelationPredicateWith,
  ast.isElementExpression,
  ast.isRelationExpression,
  ast.isDynamicViewParallelSteps,
  ast.isDynamicViewStep,
  ast.isDeploymentViewRule,
  ast.isDeploymentViewRulePredicate,
  ast.isDeploymentExpression,
  ast.isFqnRefExpression,
  ast.isFqnExpression,
  ast.isViewProperty,
  ast.isStyleProperty,
  ast.isPredicate,
  ast.isTags,
  ast.isViewRule,
  ast.isDynamicViewRule,
  ast.isLikeC4View,
  ast.isViewRuleStyleOrGlobalRef,
  ast.isDeployedInstance,
  ast.isDeploymentNode,
  ast.isRelationshipStyleProperty,
  ast.isRelation,
  ast.isElementProperty,
  ast.isStringProperty,
  ast.isNavigateToProperty,
  ast.isElement,
  ast.isExtendElement,
  ast.isSpecificationElementKind,
  ast.isSpecificationRelationshipKind,
  ast.isSpecificationDeploymentNodeKind,
  ast.isSpecificationTag,
  ast.isSpecificationColor,
  ast.isSpecificationRule
])
type ValidatableAstNode = Guarded<typeof isValidatableAstNode>

const findInvalidContainer = (node: LikeC4AstNode): ValidatableAstNode | undefined => {
  let nd = node as LikeC4AstNode['$container']
  while (nd) {
    if (isValidatableAstNode(nd)) {
      return nd
    }
    nd = nd.$container
  }
  return undefined
}

function checksFromDiagnostics(doc: LikeC4LangiumDocument) {
  const errors = doc.diagnostics?.filter(d => d.severity === DiagnosticSeverity.Error) ?? []
  const invalidNodes = new WeakSet()
  for (const { node } of errors) {
    if (isNullish(node) || invalidNodes.has(node)) {
      continue
    }
    invalidNodes.add(node)
    const container = findInvalidContainer(node)
    if (container) {
      invalidNodes.add(container)
    }
  }
  const isValid = (n: ValidatableAstNode) => !invalidNodes.has(n)
  return {
    isValid,
    invalidNodes
  }
}
export type ChecksFromDiagnostics = ReturnType<typeof checksFromDiagnostics>
export type IsValidFn = ChecksFromDiagnostics['isValid']

export class BaseParser {
  isValid: IsValidFn

  constructor(
    public readonly services: LikeC4Services,
    public readonly doc: ParsedLikeC4LangiumDocument
  ) {
    // do nothing
    this.isValid = checksFromDiagnostics(doc).isValid
  }

  resolveFqn(node: ast.FqnReferenceable): c4.Fqn {
    if (ast.isDeploymentElement(node)) {
      return this.services.likec4.DeploymentsIndex.getFqnName(node)
    }
    if (ast.isExtendElement(node)) {
      return getFqnElementRef(node.element)
    }
    const fqn = this.services.likec4.FqnIndex.getFqn(node)
    invariant(fqn, `Not indexed element: ${this.getAstNodePath(node)}`)
    return fqn
  }

  getAstNodePath(node: AstNode) {
    return this.services.workspace.AstNodeLocator.getAstNodePath(node)
  }

  getMetadata(metadataAstNode: ast.MetadataProperty | undefined): { [key: string]: string } | undefined {
    return metadataAstNode?.props != null
      ? mapToObj(metadataAstNode.props, (p) => [p.key, removeIndent(p.value)] as [string, string])
      : undefined
  }

  convertTags<E extends { tags?: ast.Tags }>(withTags?: E) {
    return this.parseTags(withTags)
  }
  parseTags<E extends { tags?: ast.Tags }>(withTags?: E) {
    let iter = withTags?.tags
    if (!iter) {
      return null
    }
    const tags = [] as c4.Tag[]
    while (iter) {
      try {
        const values = iter.values.map(t => t.ref?.name).filter(isTruthy) as c4.Tag[]
        if (values.length > 0) {
          tags.unshift(...values)
        }
      } catch (e) {
        // ignore
      }
      iter = iter.prev
    }
    return isNonEmptyArray(tags) ? tags : null
  }

  convertLinks(source?: ast.LinkProperty['$container']): ParsedLink[] | undefined {
    return this.parseLinks(source)
  }
  parseLinks(source?: ast.LinkProperty['$container']): ParsedLink[] | undefined {
    if (!source?.props || source.props.length === 0) {
      return undefined
    }
    return pipe(
      source.props,
      filter(ast.isLinkProperty),
      flatMap(p => {
        const url = p.value
        if (isTruthy(url)) {
          const title = isTruthy(p.title) ? toSingleLine(p.title) : undefined
          return title ? { url, title } : { url }
        }
        return []
      })
    )
  }
}
