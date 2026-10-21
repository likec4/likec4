// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type { ProjectId } from '@likec4/core'
import { hasProp, invariant, MultiMap, objectHash } from '@likec4/core/utils'
import { type LangiumDocument, type Stream, type URI, Disposable, DocumentState, UriUtils } from 'langium'
import { pipe } from 'remeda'
import {
  type LikeC4DocumentProps,
  type LikeC4LangiumDocument,
  type ParsedLikeC4LangiumDocument,
  isLikeC4LangiumDocument,
  isParsedLikeC4LangiumDocument,
  isValidationStateChanged,
  LikeC4DocumentPropKeys,
} from '../ast'
import { logger as rootLogger } from '../logger'
import type { LikeC4Services } from '../module'
import { ADisposable } from '../utils'
import { BaseParser } from './parser/Base'
import { DeploymentModelParser } from './parser/DeploymentModelParser'
import { DeploymentViewParser } from './parser/DeploymentViewParser'
import { ExpressionV2Parser } from './parser/FqnRefParser'
import { GlobalsParser } from './parser/GlobalsParser'
import { ImportsParser } from './parser/ImportsParser'
import { ModelParser } from './parser/ModelParser'
import { PredicatesParser } from './parser/PredicatesParser'
import { SpecificationParser } from './parser/SpecificationParser'
import { ViewsParser } from './parser/ViewsParser'

export type ModelParsedListener = () => void

const DocumentParserFromMixins = pipe(
  BaseParser,
  ExpressionV2Parser,
  ImportsParser,
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

type ReparsedListener = (doc: LikeC4LangiumDocument) => void

export class LikeC4ModelParser extends ADisposable {
  #logger = rootLogger.getChild('parser')
  private readonly reparsedListeners: ReparsedListener[] = []

  constructor(private services: LikeC4Services) {
    super()

    this.onDispose(
      // Clear cached parser when document is unlinked
      services.shared.workspace.DocumentBuilder.onDocumentResetBelow(
        DocumentState.Linked,
        ({ doc, resetTo, previous }) => {
          this.#logger.trace(
            'clear cached parser {doc} on reset below Linked (resetTo: {resetTo}, was: {previous})',
            {
              doc: services.shared.workspace.WorkspaceManager.relativePath(doc.uri),
              resetTo,
              previous,
            },
          )
          this.cleanParserState(doc)
        },
      ),
      // Parse documents when they are linked
      services.shared.workspace.DocumentBuilder.onDocumentPhase(
        DocumentState.Linked,
        async doc => {
          if (isParsedLikeC4LangiumDocument(doc)) {
            this.#logger.warn('Document {doc} was validated, we will reparse it', {
              doc: services.shared.workspace.WorkspaceManager.relativePath(doc.uri),
            })
          }
          this.createParser(doc)
        },
      ),
      // Parser created at Linked phase does not know about validation errors (there are no diagnostics yet).
      // Compare with the validation state the parser was created with, not with the previous state of the document:
      // document may be relinked with the same errors, and parser must be recreated anyway.
      services.shared.workspace.DocumentBuilder.onDocumentPhase(
        DocumentState.Validated,
        doc => {
          if (!isLikeC4LangiumDocument(doc) || !doc.likec4Parser || !isValidationStateChanged(doc, doc.likec4Parser)) {
            return
          }
          this.createParser(doc)
          this.notifyReparsed(doc)
        },
      ),
      Disposable.create(() => {
        this.reparsedListeners.length = 0
      }),
    )
  }

  /**
   * Subscribe to events when document is reparsed after validation
   * (validation state differs from the one parser was created with)
   */
  onReparsedAfterValidation(listener: ReparsedListener): Disposable {
    this.reparsedListeners.push(listener)
    return Disposable.create(() => {
      const index = this.reparsedListeners.indexOf(listener)
      if (index >= 0) {
        this.reparsedListeners.splice(index, 1)
      }
    })
  }

  private notifyReparsed(doc: LikeC4LangiumDocument): void {
    for (const listener of this.reparsedListeners) {
      try {
        listener(doc)
      } catch (error) {
        this.#logger.warn('Error in reparsed listener', { error })
      }
    }
  }

  documents(projectId: ProjectId): Stream<ParsedLikeC4LangiumDocument> {
    return this.services.shared.workspace.LangiumDocuments.projectDocuments(projectId).map(
      d => this.parse(d),
    )
  }

  parse(doc: LangiumDocument): ParsedLikeC4LangiumDocument {
    const parser = this.forDocument(doc)
    return parser.doc
  }

  /**
   * Parses the given documents again.
   *
   * A parser is created as soon as a document is linked, while the files its `descriptionFile`
   * properties reference are read when the model is built - so a parsed entity holds the reference to
   * the file until then, and the documents whose content arrived are parsed again to resolve it.
   */
  reparse(uris: Iterable<URI>): void {
    for (const uri of uris) {
      const doc = this.services.shared.workspace.LangiumDocuments.getDocument(uri)
      if (doc && isLikeC4LangiumDocument(doc) && doc.state >= DocumentState.Linked) {
        this.createParser(doc)
      }
    }
  }

  forDocument(doc: LangiumDocument): DocumentParser {
    invariant(isLikeC4LangiumDocument(doc), `Document ${doc.uri.toString()} is not a LikeC4 document`)
    return doc.likec4Parser ??= this.createParser(doc)
  }

  private cleanParserState(doc: LikeC4LangiumDocument): void {
    doc.likec4Parser?.dispose()
    for (const key of LikeC4DocumentPropKeys) {
      delete doc[key]
    }
  }

  private createParser(doc: LangiumDocument): DocumentParser {
    invariant(isLikeC4LangiumDocument(doc), `Document ${doc.uri.toString()} is not a LikeC4 document`)
    this.cleanParserState(doc)
    const project = this.services.shared.workspace.ProjectsManager.getProject(doc)
    const docpath = UriUtils.relative(project.folderUri, doc.uri)
    this.#logger.trace(`project {project}, create parser {doc}`, {
      project: project.id,
      doc: docpath,
    })
    if (doc.state < DocumentState.Linked) {
      this.#logger.error(`document {doc} is not linked, state is {state}`, {
        doc: docpath,
        state: doc.state,
      })
    }

    const props: Omit<Required<LikeC4DocumentProps>, 'diagnostics' | 'likec4Parser'> = {
      c4Specification: {
        tags: {},
        elements: {},
        relationships: {},
        colors: {},
        deployments: {},
      },
      c4Elements: [],
      c4ExtendElements: [],
      c4ExtendDeployments: [],
      c4ExtendRelations: [],
      c4Relations: [],
      c4Deployments: [],
      c4DeploymentRelations: [],
      c4Globals: {
        predicates: {},
        dynamicPredicates: {},
        styles: {},
      },
      c4Views: [],
      c4Imports: new MultiMap(Set),
      c4DescriptionFiles: [],
    }
    const parser = new DocumentParser(
      this.services,
      Object.assign(doc, props) as ParsedLikeC4LangiumDocument,
      project,
    )
    try {
      parser.parseSpecification()
      parser.parseImports()
      parser.parseModel()
      parser.parseDeployment()
      parser.parseGlobals()
      parser.parseViews()
    } catch (error) {
      this.cleanParserState(doc)
      this.#logger.warn({
        message: 'error parsing document',
        project: project.id,
        doc: docpath,
        error,
      })
      throw new Error(`Error parsing document ${docpath}`, { cause: error })
    }
    parser.hash = objectHash([parser.docPathInProject])
    for (const key of LikeC4DocumentPropKeys) {
      try {
        if (!hasProp(doc, key) || key === 'likec4Parser') {
          continue
        }
        const value = key === 'c4Imports' ? doc.c4Imports.toJSON() : doc[key]
        parser.hash = objectHash([parser.hash, value])
      } catch (error) {
        this.#logger.warn({
          message: 'error hashing document property',
          project: project.id,
          doc: docpath,
          property: key,
          error,
        })
      }
    }
    doc.likec4Parser = parser
    return parser
  }
}
