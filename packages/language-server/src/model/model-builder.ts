import type * as c4 from '@likec4/core/types'
import { DefaultElementShape, DefaultThemeColor } from '@likec4/core/types'
import { compareByFqnHierarchically, parentFqn } from '@likec4/core/utils'
import { A, O, flow, pipe } from '@mobily/ts-belt'
import { AstNode, DocumentState, LangiumDocuments, interruptAndCheck } from 'langium'
import objectHash from 'object-hash'
import { mergeDeepRight } from 'rambdax'
import { ParsedAstElement, ParsedAstRelation, ParsedAstSpecification, ast, c4hash, cleanParsedModel, isParsedLikeC4LangiumDocument, isValidDocument, resolveRelationPoints, streamElements, type LikeC4LangiumDocument, toElementStyle } from '../ast'
import { strictElementRefFqn } from '../elementRef'
import { logger } from '../logger'
import type { LikeC4Services } from '../module'
import { failExpectedNever } from '../utils'
import type { FqnIndex } from './fqn-index'


export class LikeC4ModelBuilder {

  private fqnIndex: FqnIndex
  private langiumDocuments: LangiumDocuments


  constructor(private services: LikeC4Services) {
    this.fqnIndex = services.likec4.FqnIndex
    this.langiumDocuments = services.shared.workspace.LangiumDocuments
    // services.shared.workspace.DocumentBuilder.onUpdate((_changed, removed) => {
    //   for (const uri of removed) {
    //     // logger.trace(`DocumentBuilder.removeDocument: ${uri.toString()}`)
    //     this.cleanParsedOfDoc(uri)
    //   }
    // })
    // services.shared.workspace.DocumentBuilder.onBuildPhase(DocumentState.Linked, (docs, _cancelToken) => {
    //   for (const doc of docs) {
    //     if (isLikeC4LangiumDocument(doc)) {
    //       cleanParsedModel(doc)
    //     }
    //   }
    // })
    services.shared.workspace.DocumentBuilder.onBuildPhase(DocumentState.Validated, async (docs, cancelToken) => {
      for (const doc of docs) {
        await interruptAndCheck(cancelToken)
        if (isValidDocument(doc)) {
          this.parseDocument(doc)
        }
      }
    })
  }

  private get connection() {
    return this.services.shared.lsp.Connection
  }

  private get allDocuments() {
    return this.langiumDocuments.all.toArray() as LikeC4LangiumDocument[]
  }

  public buildModel(): c4.LikeC4Model | undefined {
    const docs = this.allDocuments.filter(isParsedLikeC4LangiumDocument)
    if (docs.length === 0) {
      return
    }
    const c4Specification = docs.reduce((acc, doc) => {
      return mergeDeepRight(acc, doc.c4Specification)
    }, <ParsedAstSpecification>{
      kinds: {}
    })

    const toModelElement = (el: ParsedAstElement): c4.Element | null => {
      const kind = c4Specification.kinds[el.kind]
      if (kind) {
        return {
          ...(kind.shape !== DefaultElementShape ? { shape: kind.shape } : {}),
          ...(kind.color !== DefaultThemeColor ? { color: kind.color } : {}),
          ...el,
        }
      }
      return null
    }

    const toModelRelation = ({ astNodePath, ...rel }: ParsedAstRelation): c4.Relation => {
      return {
        ...rel,
      }
    }

    const elements = pipe(
      docs.flatMap(d => d.c4Elements),
      A.filterMap(flow(
        toModelElement,
        O.fromNullable
      )),
      A.sort(compareByFqnHierarchically),
      A.reduce({} as c4.LikeC4Model['elements'], (acc, el) => {
        const parent = parentFqn(el.id)
        if (!parent || parent in acc) {
          acc[el.id] = el
        }
        return acc
      })
    )

    const relations = pipe(
      docs.flatMap(d => d.c4Relations),
      A.filterMap(flow(
        toModelRelation,
        O.fromPredicate(({ source, target }) => source in elements && target in elements)
      )),
      A.reduce({} as c4.LikeC4Model['relations'], (acc, el) => {
        acc[el.id] = el
        return acc
      })
    )

    return {
      elements,
      relations
    }
  }

  protected parseDocument(doc: LikeC4LangiumDocument) {
    const {
      elements,
      relations,
      specification
    } = cleanParsedModel(doc)

    const spec = doc.parseResult.value.specification
    if (spec) {
      for (const { kind, style } of spec.elementKinds) {
        try {
          const styleProps = toElementStyle(style?.props)
          specification.kinds[kind.name as c4.ElementKind] = {
            color: styleProps.color ?? DefaultThemeColor,
            shape: styleProps.shape ?? DefaultElementShape,
          }
        } catch (e) {
          logger.warn(e)
        }
      }
    }

    for (const el of streamElements(doc)) {
      if (ast.isElement(el)) {
        try {
          elements.push(this.toElement(el))
        } catch (e) {
          logger.warn(e)
        }
        continue
      }
      if (ast.isRelation(el)) {
        try {
          relations.push(this.toRelation(el))
        } catch (e) {
          logger.warn(e)
        }
        continue
      }
      failExpectedNever(el)
    }
    const prevHash = doc.c4hash ?? ''
    doc.c4hash = c4hash(doc)
    return prevHash !== doc.c4hash
  }

  private toElement(astNode: ast.Element): LikeC4LangiumDocument['c4Elements'][number] {
    const id = this.resolveFqn(astNode)
    const kind = astNode.kind.ref!.name as c4.ElementKind
    const tags = (astNode.definition && this.convertTags(astNode.definition)) ?? []
    const styleProps = astNode.definition?.props.find(ast.isElementStyleProperty)?.props
    const {
      color,
      shape
    } = toElementStyle(styleProps)
    // const color = styleProps.find(ast.isColorProperty)?.value
    // const shape = styleProps.find(ast.isShapeProperty)?.value
    return {
      id,
      kind,
      title: astNode.title ?? astNode.name,
      ...(tags.length > 0 ? { tags } : {}),
      ...(shape && shape !== DefaultElementShape ? { shape } : {}),
      ...(color && color !== DefaultThemeColor ? { color } : {}),
    }
  }

  private toRelation(ast: ast.Relation): LikeC4LangiumDocument['c4Relations'][number] {
    const coupling = resolveRelationPoints(ast)
    const target = this.resolveFqn(coupling.target)
    const source = this.resolveFqn(coupling.source)
    const hashdata = {
      astNodePath: this.getAstNodePath(ast),
      source,
      target
    }
    const id = objectHash(hashdata) as c4.RelationID
    return {
      id,
      ...hashdata,
      title: ast.title ?? '',
    }
  }

  protected resolveFqn(node: ast.Element | ast.ExtendElement) {
    if (ast.isExtendElement(node)) {
      return strictElementRefFqn(node.element)
    }
    const fqn = this.fqnIndex.get(node)
    if (!fqn) {
      throw new Error(`Not indexed element: ${this.getAstNodePath(node)}`)
    }
    return fqn
  }

  private getAstNodePath(node: AstNode) {
    return this.services.workspace.AstNodeLocator.getAstNodePath(node)
  }

  private convertTags(el: { tags?: ast.Tags }) {
    return el.tags?.value.map(tagRef =>
      tagRef.ref?.name as c4.Tag
    ) ?? []
  }
}
