import { invariant } from '@likec4/core'
import { type LangiumDocument, type Stream, DocumentCache, DocumentState } from 'langium'
import { pipe } from 'remeda'
import type { LikeC4DocumentProps, ParsedLikeC4LangiumDocument } from '../ast'
import { logger } from '../logger'
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

export class LikeC4ModelParser {
  private cachedParsers: DocumentCache<string, DocumentParser>

  constructor(private services: LikeC4Services) {
    this.cachedParsers = new DocumentCache(services.shared, DocumentState.IndexedReferences)

    // We need to clean up cached parser after document is validated
    // Because after that parser takes into account validation results
    services.shared.workspace.DocumentBuilder.onDocumentPhase(
      DocumentState.Validated,
      doc => {
        try {
          this.cachedParsers.set(doc.uri, 'DocumentParser', this.createParser(doc))
        } catch (error) {
          logger.error(`Error caching parser for document ${doc.uri.toString()}`, { error })
        }
        return Promise.resolve()
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
    invariant(doc.state >= DocumentState.IndexedReferences, `Not a IndexedReferences: ${doc.uri.toString(true)}`)
    return this.cachedParsers.get(
      doc.uri,
      'DocumentParser',
      () => this.createParser(doc),
    )
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
