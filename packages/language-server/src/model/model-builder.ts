import { computeViews } from '@likec4/core/compute-view'
import type * as c4 from '@likec4/core/types'
import { DefaultElementShape, DefaultThemeColor } from '@likec4/core/types'
import { compareByFqnHierarchically, parentFqn } from '@likec4/core/utils'
import { A, O, flow, pipe } from '@mobily/ts-belt'
import type { AstNode, LangiumDocuments } from 'langium'
import { DocumentState, getDocument, interruptAndCheck } from 'langium'
import objectHash from 'object-hash'
import { clone, isNil, mergeDeepRight, omit, reduce } from 'rambdax'
import invariant from 'tiny-invariant'
import type { CancellationToken } from 'vscode-languageserver-protocol'
import type { ParsedAstElement, ParsedAstElementView, ParsedAstRelation, ParsedAstSpecification } from '../ast'
import { ElementViewOps, ast, c4hash, cleanParsedModel, isLikeC4LangiumDocument, isParsedLikeC4LangiumDocument, resolveRelationPoints, streamElements, toElementStyle, type LikeC4LangiumDocument } from '../ast'
import { elementRef, strictElementRefFqn } from '../elementRef'
import { logger } from '../logger'
import type { LikeC4Services } from '../module'
import { Rpc } from '../protocol'
import { failExpectedNever } from '../utils'
import type { FqnIndex } from './fqn-index'


export class LikeC4ModelBuilder {

  private fqnIndex: FqnIndex
  private langiumDocuments: LangiumDocuments

  constructor(private services: LikeC4Services) {
    this.fqnIndex = services.likec4.FqnIndex
    this.langiumDocuments = services.shared.workspace.LangiumDocuments

    services.shared.workspace.DocumentBuilder.onBuildPhase(DocumentState.Validated, async (docs, cancelToken) => {
      let countOfChangedDocs = 0
      try {
        for (const doc of docs) {
          await interruptAndCheck(cancelToken)
          try {
            if (isLikeC4LangiumDocument(doc) && this.parseDocument(doc)) {
              countOfChangedDocs++
            }
          } catch (e) {
            logger.warn(`Error parsing document ${doc.uri.toString()}`)
          }
        }
      } finally {
        if (countOfChangedDocs > 0 && !cancelToken.isCancellationRequested) {
          await this.notifyClient()
        }
      }
    })
  }

  private get connection() {
    return this.services.shared.lsp.Connection
  }

  private documents() {
    return this.langiumDocuments.all.toArray().filter(isParsedLikeC4LangiumDocument)
  }

  public buildModel(): c4.LikeC4Model | undefined {
    const docs = this.documents()
    if (docs.length === 0) {
      return
    }
    try {
      const c4Specification = reduce(
        (acc: ParsedAstSpecification, doc) => mergeDeepRight(acc, doc.c4Specification),
        {
          kinds: {}
        },
        docs
      )
      // const c4Specification = docs.reduce<ParsedAstSpecification>((acc, doc) => {
      //   return mergeDeepRight(acc, doc.c4Specification)
      // }, {
      //   kinds: {}
      // })

      const toModelElement = (el: ParsedAstElement): c4.Element | null => {
        const kind = c4Specification.kinds[el.kind]
        if (kind) {
          return {
            ...(kind.shape !== DefaultElementShape ? { shape: kind.shape } : {}),
            ...(kind.color !== DefaultThemeColor ? { color: kind.color } : {}),
            ...(omit(['astPath'], el))
          }
        }
        return null
      }

      const toModelRelation = (rel: ParsedAstRelation): c4.Relation => {
        return omit(['astPath'], rel)
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
      const toModelView = (view: ParsedAstElementView): c4.ElementView => {
        let title = view.title
        if (!title && view.viewOf) {
          title = elements[view.viewOf]?.title
        }
        return {
          ...omit(['astPath', 'rules', 'tite'], view),
          ...(!!title ? { title } : {}),
          rules: clone(view.rules)
        }
      }

      const views = pipe(
        docs.flatMap(d => d.c4Views),
        A.filterMap(flow(
          toModelView,
          O.fromPredicate(v => isNil(v.viewOf) || v.viewOf in elements)
        )),
        A.reduce({} as Record<c4.ViewID, c4.ElementView>, (acc, v) => {
          invariant(!(v.id in acc), 'Duplicate view id: ' + v.id)
          acc[v.id] = v
          return acc
        })
      )

      return computeViews({
        elements,
        relations,
        views
      })
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
          const v = this.parseElementView(view)
          ElementViewOps.writeId(view, v.id)
          views.push(v)
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
    invariant(astNode.kind.ref, 'Element kind is not resolved: ' + astNode.name)
    const kind = astNode.kind.ref.name as c4.ElementKind
    const tags = (astNode.definition && this.convertTags(astNode.definition)) ?? []
    const styleProps = astNode.definition?.props.find(ast.isElementStyleProperty)?.props
    const {
      color,
      shape
    } = toElementStyle(styleProps)
    const astPath = this.getAstNodePath(astNode)

    const props = astNode.definition?.props.filter((p): p is ast.ElementStringProperty => ast.isElementStringProperty(p))

    const title = astNode.title ?? props?.find(p => p.key === 'title')?.value
    const description = props?.find(p => p.key === 'description')?.value
    const technology = props?.find(p => p.key === 'technology')?.value
    return {
      id,
      kind,
      astPath,
      title: title ?? astNode.name,
      ...(technology && { technology }),
      ...(description && { description }),
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
      astPath: this.getAstNodePath(astNode),
      source,
      target
    }
    const id = objectHash(hashdata) as c4.RelationID
    const title = astNode.definition?.props.find(p => p.key === 'title')?.value ?? ''
    return {
      id,
      ...hashdata,
      title: astNode.title ?? title
    }
  }

  private parseElementExpression(astNode: ast.ElementExpression): c4.ElementExpression {
    if (ast.isWildcardExpression(astNode)) {
      return {
        wildcard: true
      }
    }
    if (ast.isElementRefExpression(astNode)) {
      const element = elementRef(astNode.id)
      invariant(element, 'Element not found ' + astNode.id.$cstNode?.text)
      return {
        element: this.resolveFqn(element),
        isDescedants: astNode.isDescedants
      }
    }
    failExpectedNever(astNode)
  }

  private parseExpression(astNode: ast.Expression): c4.Expression {
    if (ast.isElementExpression(astNode)) {
      return this.parseElementExpression(astNode)
    }
    if (ast.isIncomingExpression(astNode)) {
      return {
        incoming: this.parseElementExpression(astNode.target)
      }
    }
    if (ast.isOutgoingExpression(astNode)) {
      return {
        outgoing: this.parseElementExpression(astNode.source)
      }
    }
    if (ast.isInOutExpression(astNode)) {
      return {
        inout: this.parseElementExpression(astNode.inout.target)
      }
    }
    if (ast.isRelationExpression(astNode)) {
      return {
        source: this.parseElementExpression(astNode.source),
        target: this.parseElementExpression(astNode.target),
      }
    }
    failExpectedNever(astNode)
  }

  private parseViewRule(astNode: ast.ViewRule): c4.ViewRule {
    if (ast.isViewRuleExpression(astNode)) {
      const exprs = astNode.expressions.map(n => this.parseExpression(n))
      return {
        isInclude: astNode.isInclude,
        exprs
      }
    }
    if (ast.isViewRuleStyle(astNode)) {
      const styleProps = toElementStyle(astNode.props)
      return {
        targets: astNode.targets.map(n => this.parseElementExpression(n)),
        style: {
          ...styleProps
        }
      }
    }
    failExpectedNever(astNode)
  }

  private parseElementView(astNode: ast.ElementView): ParsedAstElementView {
    const viewOfEl = astNode.viewOf && elementRef(astNode.viewOf)
    const viewOf = viewOfEl && this.resolveFqn(viewOfEl)
    const astPath = this.getAstNodePath(astNode)
    let id = astNode.name as c4.ViewID | undefined
    if (!id) {
      const doc = getDocument(astNode).uri.toString()
      id = objectHash({
        doc,
        astPath,
        viewOf: viewOf ?? null
      }) as c4.ViewID
    }

    const title = astNode.properties.find(p => p.key === 'title')?.value
    const description = astNode.properties.find(p => p.key === 'description')?.value

    return {
      id,
      astPath,
      ...(viewOf && { viewOf }),
      ...(title && { title }),
      ...(description && { description }),
      rules: astNode.rules.map(n => this.parseViewRule(n))
    }
  }

  protected resolveFqn(node: ast.Element | ast.ExtendElement) {
    if (ast.isExtendElement(node)) {
      return strictElementRefFqn(node.element)
    }
    const fqn = this.fqnIndex.get(node)
    invariant(fqn, `Not indexed element: ${this.getAstNodePath(node)}`)
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
    logger.debug('Send onDidChangeModel')
    await connection.sendNotification(Rpc.onDidChangeModel, null)
  }
}
