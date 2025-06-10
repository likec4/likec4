import type * as c4 from '@likec4/core'
import { invariant, isNonEmptyArray, LinkedList, nonexhaustive, nonNullable } from '@likec4/core'
import { FqnRef } from '@likec4/core/types'
import { loggable } from '@likec4/log'
import { filter, first, isDefined, isEmpty, isNonNullish, isTruthy, map, mapToObj, pipe } from 'remeda'
import {
  type LikeC4LangiumDocument,
  type ParsedAstElement,
  type ParsedAstExtend,
  type ParsedAstRelation,
  ast,
  toRelationshipStyleExcludeDefaults,
} from '../../ast'
import { logger as mainLogger } from '../../logger'
import { stringHash } from '../../utils/stringHash'
import { removeIndent, toSingleLine } from './Base'
import type { WithExpressionV2 } from './FqnRefParser'

export type WithModel = ReturnType<typeof ModelParser>

const logger = mainLogger.getChild('ModelParser')

function* streamModel(doc: LikeC4LangiumDocument) {
  const traverseStack = LinkedList.from(doc.parseResult.value.models.flatMap(m => m.elements))
  const relations = [] as ast.Relation[]
  let el
  while ((el = traverseStack.shift())) {
    if (ast.isRelation(el)) {
      relations.push(el)
      continue
    }
    if (el.body && el.body.elements && el.body.elements.length > 0) {
      for (const child of el.body.elements) {
        traverseStack.push(child)
      }
    }
    yield el
  }
  yield* relations
  return
}

export function ModelParser<TBase extends WithExpressionV2>(B: TBase) {
  return class ModelParser extends B {
    parseModel() {
      const doc = this.doc
      for (const el of streamModel(doc)) {
        try {
          if (ast.isElement(el)) {
            doc.c4Elements.push(this.parseElement(el))
            continue
          }
          if (ast.isRelation(el)) {
            if (this.isValid(el)) {
              doc.c4Relations.push(this.parseRelation(el))
            }
            continue
          }
          if (ast.isExtendElement(el)) {
            const parsed = this.parseExtendElement(el)
            if (parsed) {
              doc.c4ExtendElements.push(parsed)
            }
            continue
          }
          nonexhaustive(el)
        } catch (e) {
          const astPath = this.getAstNodePath(el)
          const error = loggable(e)
          const message = e instanceof Error ? e.message : String(error)
          logger.warn(`Error on {eltype}: ${message}\n document: {path}\n astpath: {astPath}\n${error}`, {
            path: doc.uri.path,
            eltype: el.$type,
            astPath,
          })
        }
      }
    }

    parseElement(astNode: ast.Element): ParsedAstElement {
      const isValid = this.isValid
      const id = this.resolveFqn(astNode)
      const kind = nonNullable(astNode.kind.ref, 'Element kind is not resolved').name as c4.ElementKind
      const tags = this.parseTags(astNode.body)
      const style = this.parseElementStyle(astNode.body?.props)
      const metadata = this.getMetadata(astNode.body?.props.find(ast.isMetadataProperty))
      const astPath = this.getAstNodePath(astNode)

      let [title, description, technology] = astNode.props ?? []

      const bodyProps = pipe(
        astNode.body?.props ?? [],
        filter(isValid),
        filter(ast.isElementStringProperty),
        mapToObj(p => [p.key, p.value || undefined]),
      )

      title = removeIndent(title ?? bodyProps.title)
      description = removeIndent(bodyProps.description ?? description)
      technology = toSingleLine(bodyProps.technology ?? technology)

      const links = this.parseLinks(astNode.body)

      return {
        id,
        kind,
        astPath,
        title: title ?? astNode.name,
        ...(metadata && { metadata }),
        ...(tags && { tags }),
        ...(links && isNonEmptyArray(links) && { links }),
        ...(isTruthy(technology) && { technology }),
        ...(isTruthy(description) && { description }),
        style,
      }
    }

    parseExtendElement(astNode: ast.ExtendElement): ParsedAstExtend | null {
      const id = this.resolveFqn(astNode)
      const tags = this.parseTags(astNode.body)
      const metadata = this.getMetadata(astNode.body?.props.find(ast.isMetadataProperty))
      const astPath = this.getAstNodePath(astNode)
      const links = this.parseLinks(astNode.body) ?? []

      if (!tags && isEmpty(metadata ?? {}) && isEmpty(links)) {
        return null
      }

      return {
        id,
        astPath,
        ...(metadata && { metadata }),
        ...(tags && { tags }),
        ...(links && isNonEmptyArray(links) && { links }),
      }
    }

    _resolveRelationSource(node: ast.Relation): FqnRef.ModelRef | FqnRef.ImportRef {
      if (isDefined(node.source)) {
        const source = this.parseFqnRef(node.source)
        invariant(FqnRef.isModelRef(source) || FqnRef.isImportRef(source), 'Relation source must be a model reference')
        return source
      }
      if (!ast.isElementBody(node.$container)) {
        throw new Error('RelationRefError: Invalid container for sourceless relation')
      }
      return {
        model: this.resolveFqn(node.$container.$container),
      }
    }

    parseRelation(astNode: ast.Relation): ParsedAstRelation {
      const isValid = this.isValid
      const source = this._resolveRelationSource(astNode)
      const target = this.parseFqnRef(astNode.target)
      invariant(FqnRef.isModelRef(target) || FqnRef.isImportRef(target), 'Target must be a model reference')

      const tags = this.parseTags(astNode) ?? this.parseTags(astNode.body)
      const links = this.parseLinks(astNode.body)
      const kind = (astNode.kind ?? astNode.dotKind?.kind)?.ref?.name as (c4.RelationshipKind | undefined)
      const metadata = this.getMetadata(astNode.body?.props.find(ast.isMetadataProperty))
      const astPath = this.getAstNodePath(astNode)

      const bodyProps = mapToObj(
        astNode.body?.props.filter(ast.isRelationStringProperty).filter(p => isNonNullish(p.value)) ?? [],
        p => [p.key, p.value],
      )

      const navigateTo = pipe(
        astNode.body?.props ?? [],
        filter(ast.isRelationNavigateToProperty),
        map(p => p.value.view.ref?.name),
        filter(isTruthy),
        first(),
      )

      const title = removeIndent(astNode.title ?? bodyProps.title) ?? ''
      const description = removeIndent(bodyProps.description)
      const technology = toSingleLine(astNode.technology) ?? removeIndent(bodyProps.technology)

      const styleProp = astNode.body?.props.find(ast.isRelationStyleProperty)
      const id = stringHash(
        astPath,
        source.model,
        target.model,
      ) as c4.RelationId
      return {
        id,
        astPath,
        source,
        target,
        title,
        ...(metadata && { metadata }),
        ...(isTruthy(technology) && { technology }),
        ...(isTruthy(description) && { description }),
        ...(kind && { kind }),
        ...(tags && { tags }),
        ...(isNonEmptyArray(links) && { links }),
        ...toRelationshipStyleExcludeDefaults(styleProp?.props, isValid),
        ...(navigateTo && { navigateTo: navigateTo as c4.ViewId }),
      }
    }
  }
}
