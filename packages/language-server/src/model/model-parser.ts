import { DefaultWeakMap, invariant } from '@likec4/core'
import { loggable } from '@likec4/log'
import { type LangiumDocument, type Stream, DocumentState } from 'langium'
import { pipe } from 'remeda'
import { DiagnosticSeverity } from 'vscode-languageserver-types'
import type { LikeC4DocumentProps, ParsedLikeC4LangiumDocument } from '../ast'
import { isLikeC4Builtin } from '../likec4lib'
import { logger as rootLogger } from '../logger'
import type { LikeC4Services } from '../module'
import { BaseParser } from './parser/Base'
import { DeploymentModelParser } from './parser/DeploymentModelParser'
import { DeploymentViewParser } from './parser/DeploymentViewParser'
import { ExpressionV2Parser } from './parser/FqnRefParser'
import { GlobalsParser } from './parser/GlobalsParser'
import { ModelParser } from './parser/ModelParser'
import { PredicatesParser } from './parser/PredicatesParser'
import { SpecificationParser } from './parser/SpecificationParser'
import { ViewsParser } from './parser/ViewsParser'

export type ModelParsedListener = () => void

const DocumentParserFromMixins = pipe(
  BaseParser,
  ExpressionV2Parser,
  ModelParser,
  DeploymentModelParser,
  DeploymentViewParser,
  PredicatesParser,
  SpecificationParser,
  ViewsParser,
  GlobalsParser,
)

export class DocumentParser extends DocumentParserFromMixins {
}

const logger = rootLogger.getChild('ModelParser')

export class LikeC4ModelParser {
  protected cachedParsers = new DefaultWeakMap((doc: LangiumDocument) => this.createParser(doc))

  constructor(private services: LikeC4Services) {
    services.shared.workspace.DocumentBuilder.onDocumentPhase(
      DocumentState.Linked,
      doc => {
        try {
          if (!isLikeC4Builtin(doc.uri)) {
            this.cachedParsers.set(doc, this.createParser(doc))
          }
        } catch (e) {
          logger.warn(loggable(e))
        }
      },
    )

    // We need to clean up cached parser after document is validated
    // Because after that parser takes into account validation results
    services.shared.workspace.DocumentBuilder.onDocumentPhase(
      DocumentState.Validated,
      doc => {
        if (doc.diagnostics?.some(d => d.severity === DiagnosticSeverity.Error)) {
          this.cachedParsers.delete(doc)
        }
      },
    )
  }

  documents(): Stream<ParsedLikeC4LangiumDocument> {
    return this.services.shared.workspace.LangiumDocuments.all.map(
      d => this.parse(d),
    )
  }

  parse(doc: LangiumDocument): ParsedLikeC4LangiumDocument {
    try {
      const parser = this.forDocument(doc)
      return parser.doc
    } catch (cause) {
      throw new Error(`Error parsing document ${doc.uri.toString()}`, { cause })
    }
  }

  forDocument(doc: LangiumDocument): DocumentParser {
    invariant(doc.state >= DocumentState.Linked, `Not a Linked: ${doc.uri.toString(true)}`)
    return this.cachedParsers.get(doc)
  }

  private createParser(doc: LangiumDocument): DocumentParser {
    const props: Required<Omit<LikeC4DocumentProps, 'diagnostics'>> = {
      c4Specification: {
        tags: new Set(),
        elements: {},
        relationships: {},
        colors: {},
        deployments: {},
      },
      c4Elements: [],
      c4ExtendElements: [],
      c4ExtendDeployments: [],
      c4Relations: [],
      c4Deployments: [],
      c4DeploymentRelations: [],
      c4Globals: {
        predicates: {},
        dynamicPredicates: {},
        styles: {},
      },
      c4Views: [],
    }
    doc = Object.assign(doc, props)
    const parser = new DocumentParser(this.services, doc as ParsedLikeC4LangiumDocument)
    parser.parseSpecification()
    parser.parseModel()
    parser.parseGlobals()
    parser.parseDeployment()
    parser.parseViews()
    return parser
  }
}
