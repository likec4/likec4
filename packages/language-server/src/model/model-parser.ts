import { invariant } from '@likec4/core'
import type { LangiumDocument } from 'langium'
import { AstUtils } from 'langium'
import type { LikeC4DocumentProps, LikeC4LangiumDocument, ParsedLikeC4LangiumDocument } from '../ast'
import { isFqnIndexedDocument } from '../ast'
import type { LikeC4Services } from '../module'
import { BaseParser } from './parser/Base'
import { DeploymentModelParser } from './parser/DeploymentModelParser'
import { DeploymentViewParser } from './parser/DeploymentViewParser'
import { FqnRefParser } from './parser/FqnRefParser'
import { GlobalsParser } from './parser/GlobalsParser'
import { ModelParser } from './parser/ModelParser'
import { PredicatesParser } from './parser/PredicatesParser'
import { SpecificationParser } from './parser/SpecificationParser'
import { ViewsParser } from './parser/ViewsParser'

const { getDocument } = AstUtils

export type ModelParsedListener = () => void

const DocumentParserMixins = GlobalsParser(
  ViewsParser(
    SpecificationParser(
      PredicatesParser(
        DeploymentViewParser(
          DeploymentModelParser(
            ModelParser(
              FqnRefParser(BaseParser)
            )
          )
        )
      )
    )
  )
)

class DocumentParser extends DocumentParserMixins {
  static process(
    services: LikeC4Services,
    doc: LikeC4LangiumDocument
  ) {
    const props: Required<Omit<LikeC4DocumentProps, 'c4fqnIndex' | 'diagnostics'>> = {
      c4Specification: {
        tags: new Set(),
        elements: {},
        relationships: {},
        colors: {},
        deployments: {}
      },
      c4Elements: [],
      c4Relations: [],
      c4Deployments: [],
      c4DeploymentRelations: [],
      c4Globals: {
        predicates: {},
        dynamicPredicates: {},
        styles: {}
      },
      c4Views: []
    }
    const parser = new DocumentParser(services, Object.assign(doc, props) as ParsedLikeC4LangiumDocument)
    parser.parseSpecification()
    parser.parseModel()
    parser.parseGlobals()
    parser.parseDeployment()
    parser.parseViews()
    return parser.doc
  }
}

export class LikeC4ModelParser {
  constructor(private services: LikeC4Services) {
  }

  parse(doc: LangiumDocument): ParsedLikeC4LangiumDocument {
    invariant(isFqnIndexedDocument(doc), `Not a FqnIndexedDocument: ${doc.uri.toString(true)}`)
    try {
      return DocumentParser.process(this.services, doc)
    } catch (cause) {
      throw new Error(`Error parsing document ${doc.uri.toString()}`, { cause })
    }
  }

  withDocument(doc: LangiumDocument): DocumentParser {
    invariant(isFqnIndexedDocument(doc), `Not a FqnIndexedDocument: ${doc.uri.toString(true)}`)
    return new DocumentParser(this.services, doc as ParsedLikeC4LangiumDocument)
  }
}
