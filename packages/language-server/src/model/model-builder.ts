import type * as c4 from '@likec4/core/types'
import { DefaultElementShape, DefaultThemeColor } from '@likec4/core/types'
import { compareByFqnHierarchically, parentFqn } from '@likec4/core/utils'
import { A, O, F, flow, pipe } from '@mobily/ts-belt'
import { AstNode, DocumentState, LangiumDocuments, getDocument, interruptAndCheck } from 'langium'
import objectHash from 'object-hash'
import { isNil, mergeDeepRight } from 'rambdax'
import { ParsedAstElement, ParsedAstRelation, ParsedAstSpecification, ast, c4hash, cleanParsedModel, isParsedLikeC4LangiumDocument, isValidDocument, resolveRelationPoints, streamElements, type LikeC4LangiumDocument, toElementStyle, ParsedAstElementView, isLikeC4LangiumDocument } from '../ast'
import { elementRef, strictElementRefFqn } from '../elementRef'
import { logger } from '../logger'
import type { LikeC4Services } from '../module'
import { failExpectedNever } from '../utils'
import type { FqnIndex } from './fqn-index'
import invariant from 'tiny-invariant'
import { onDidChangeLikeC4Model } from '../protocol'


export class LikeC4ModelBuilder {

  private fqnIndex: FqnIndex
  private langiumDocuments: LangiumDocuments


  constructor(private services: LikeC4Services) {
    this.fqnIndex = services.likec4.FqnIndex
    this.langiumDocuments = services.shared.workspace.LangiumDocuments

    services.shared.workspace.DocumentBuilder.onBuildPhase(DocumentState.Validated, async (docs, cancelToken) => {
      let countOfChangedDocs = 0
      for (const doc of docs) {
        await interruptAndCheck(cancelToken)
        try {
          if (isLikeC4LangiumDocument(doc) && this.parseDocument(doc)) {
            countOfChangedDocs++
          }
        } catch (e) {
          logger.error(`Error parsing document ${doc.uri.toString()}`)
        }
      }
      if (countOfChangedDocs > 0) {
        await this.notifyClient()
      }
    })
  }

  private get connection() {
    return this.services.shared.lsp.Connection
  }

  private get documents() {
    return this.langiumDocuments.all.toArray().filter(isLikeC4LangiumDocument)
  }

  public buildModel(): c4.LikeC4Model | undefined {
    const docs = this.documents.filter(isParsedLikeC4LangiumDocument)
    if (docs.length === 0) {
      return
    }
    try {
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

      const toModelView = ({ astNodePath, ...view }: ParsedAstElementView): c4.ElementView => {
        return {
          ...view,
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
            invariant(!(el.id in acc), 'Duplicate element id: ' + el.id)
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
          invariant(!(el.id in acc), 'Duplicate relation id: ' + el.id)
          acc[el.id] = el
          return acc
        })
      )

      const views = pipe(
        docs.flatMap(d => d.c4Views),
        A.filterMap(flow(
          toModelView,
          O.fromPredicate(v => isNil(v.viewOf) || v.viewOf in elements)
        )),
        A.reduce({} as c4.LikeC4Model['views'], (acc, v) => {
          invariant(!(v.id in acc), 'Duplicate view id: ' + v.id)
          acc[v.id] = v
          return acc
        })
      )

      return {
        elements,
        relations,
        views
      }

    } catch (e) {
      logger.error(e)
      return
    }
  }

  /**
   * @returns if the document was changed
   */
  protected parseDocument(doc: LikeC4LangiumDocument) {
    const {
      elements,
      relations,
      views,
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
          elements.push(this.parseElement(el))
        } catch (e) {
          logger.warn(e)
        }
        continue
      }
      if (ast.isRelation(el)) {
        try {
          relations.push(this.parseRelation(el))
        } catch (e) {
          logger.warn(e)
        }
        continue
      }
      failExpectedNever(el)
    }
    const docviews = doc.parseResult.value.views?.views
    if (docviews) {
      for (const view of docviews) {
        try {
          views.push(this.parseElementView(view))
        } catch (e) {
          logger.warn(e)
        }
      }
    }
    const prevHash = doc.c4hash ?? ''
    doc.c4hash = c4hash(doc)
    return prevHash !== doc.c4hash
  }

  private parseElement(astNode: ast.Element): ParsedAstElement {
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

  private parseRelation(astNode: ast.Relation): ParsedAstRelation {
    const coupling = resolveRelationPoints(astNode)
    const target = this.resolveFqn(coupling.target)
    const source = this.resolveFqn(coupling.source)
    const hashdata = {
      astNodePath: this.getAstNodePath(astNode),
      source,
      target
    }
    const id = objectHash(hashdata) as c4.RelationID
    return {
      id,
      ...hashdata,
      title: astNode.title ?? '',
    }
  }

  private parseElementView(astNode: ast.ElementView): ParsedAstElementView {
    const viewOfEl = astNode.viewOf && elementRef(astNode.viewOf)
    const viewOf = viewOfEl && this.resolveFqn(viewOfEl)
    const astNodePath = this.getAstNodePath(astNode)
    let id = astNode.name as c4.ViewID | undefined
    if (!id) {
      const doc = getDocument(astNode).uri.toString()
      id = objectHash({
        doc,
        astNodePath,
        viewOf: viewOf ?? null,
      }) as c4.ViewID
    }

    const title = astNode.properties.find(p => p.key === 'title')?.value
    const description = astNode.properties.find(p => p.key === 'description')?.value

    return {
      id,
      astNodePath,
      ...(viewOf && { viewOf }),
      ...(title && { title }),
      ...(description && { description }),
      rules: []
    }
    // const coupling = resolveRelationPoints(ast)
    // const target = this.resolveFqn(coupling.target)
    // const source = this.resolveFqn(coupling.source)
    // const hashdata = {
    //   astNodePath: this.getAstNodePath(ast),
    //   source,
    //   target
    // }
    // const id = objectHash(hashdata) as c4.RelationID
    // return {
    //   id,
    //   ...hashdata,
    //   title: ast.title ?? '',
    // }
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

  private async notifyClient() {
    const connection = this.connection
    if (!connection) {
      return
    }
    logger.debug('Send onDidChangeLikeC4Model')
    await connection.sendNotification(onDidChangeLikeC4Model, null)
  }
}
