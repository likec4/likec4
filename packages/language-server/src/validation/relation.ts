// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2025 Denis Davydkov
// Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { FqnRef, isSameHierarchy } from '@likec4/core'
import { type ValidationCheck, AstUtils } from 'langium'
import { type LikeC4LangiumDocument, ast, isParsedLikeC4LangiumDocument } from '../ast'
import type { LikeC4Services } from '../module'
import { safeCall } from '../utils'
import { stringHash } from '../utils/stringHash'
import { tryOrLog } from './_shared'

// Cache of relation match keys to avoid recomputing for every extend validation
let cachedRelationKeys: Set<string> | null = null
let cachedDocsFingerprint: string | null = null

const computeDocsFingerprint = (docs: LikeC4LangiumDocument[]): string => {
  return docs
    .map(doc => {
      const relationHashes = (doc.c4Relations ?? [])
        .map(rel =>
          stringHash(
            'extend-relation',
            FqnRef.flatten(rel.source),
            FqnRef.flatten(rel.target),
            rel.kind ?? 'default',
            rel.title ?? '',
          )
        )
        .sort()
        .join(',')
      return `${doc.uri.toString()}:${relationHashes}`
    })
    .join('|')
}

export const relationChecks = (services: LikeC4Services): ValidationCheck<ast.Relation> => {
  const modelParser = services.likec4.ModelParser

  return tryOrLog((el, accept) => {
    const parser = modelParser.forDocument(AstUtils.getDocument(el))

    const source = safeCall(() => parser._resolveRelationSource(el))
    if (!source) {
      accept('error', 'Source not resolved', {
        node: el,
        property: 'source',
      })
      return
    }
    const target = safeCall(() => parser.parseFqnRef(el.target))
    if (!target) {
      accept('error', 'Target not resolved', {
        node: el,
        property: 'target',
      })
      return
    }

    if (FqnRef.isImportRef(source)) {
      if (FqnRef.isImportRef(target)) {
        accept('warning', 'Relationship between imported elements may not be visible in origin projects', {
          node: el,
        })
      } else {
        accept('warning', 'Relationship from imported element to local element may not be visible in origin project', {
          node: el,
          property: 'source',
        })
      }
    }

    if (isSameHierarchy(FqnRef.flatten(source), FqnRef.flatten(target))) {
      accept('error', 'Invalid parent-child relationship', {
        node: el,
      })
    }
  })
}

export const checkRelationBody = (_services: LikeC4Services): ValidationCheck<ast.RelationBody> => {
  return tryOrLog((body, accept) => {
    const relation = body.$container
    if (relation.tags?.values && body.tags?.values) {
      accept('error', 'Relation cannot have tags in both header and body', {
        node: body.tags,
      })
    }
  })
}

export const extendRelationChecks = (services: LikeC4Services): ValidationCheck<ast.ExtendRelation> => {
  const modelParser = services.likec4.ModelParser

  return tryOrLog((el, accept) => {
    const parser = modelParser.forDocument(AstUtils.getDocument(el))

    const source = safeCall(() => parser.parseFqnRef(el.source))
    if (!source) {
      accept('error', 'Source not resolved', {
        node: el,
        property: 'source',
      })
      return
    }
    const target = safeCall(() => parser.parseFqnRef(el.target))
    if (!target) {
      accept('error', 'Target not resolved', {
        node: el,
        property: 'target',
      })
      return
    }

    if (!FqnRef.isModelRef(source) && !FqnRef.isImportRef(source)) {
      accept('error', 'Source must reference a model element', {
        node: el,
        property: 'source',
      })
      return
    }

    if (!FqnRef.isModelRef(target) && !FqnRef.isImportRef(target)) {
      accept('error', 'Target must reference a model element', {
        node: el,
        property: 'target',
      })
      return
    }

    // Warn if this extend does not match any relation in the workspace
    // Build a match key identical to buildModel.ts
    const kind = (el.kind ?? el.dotKind?.kind)?.ref?.name ?? 'default'
    // Normalize title using the same parser helper
    const { title = '' } = parser.parseBaseProps({}, { title: el.title })

    const extendKey = stringHash(
      'extend-relation',
      FqnRef.flatten(source),
      FqnRef.flatten(target),
      kind,
      title,
    )

    // Build (or reuse) a Set of all relation match keys across the workspace.
    // This avoids O(E x D x R) scans on large workspaces.
    const docs = services.shared.workspace.LangiumDocuments.all
      .toArray()
      .filter(isParsedLikeC4LangiumDocument)

    const fingerprint = computeDocsFingerprint(docs)

    if (fingerprint !== cachedDocsFingerprint) {
      const keys = new Set<string>()
      for (const d of docs) {
        for (const rel of d.c4Relations ?? []) {
          const key = stringHash(
            'extend-relation',
            FqnRef.flatten(rel.source),
            FqnRef.flatten(rel.target),
            rel.kind ?? 'default',
            rel.title ?? '',
          )
          keys.add(key)
        }
      }
      cachedRelationKeys = keys
      cachedDocsFingerprint = fingerprint
    }

    const hasMatch = cachedRelationKeys?.has(extendKey) ?? false

    if (!hasMatch) {
      accept('warning', 'This extend does not match any relation (by source, kind, target, title)', {
        node: el,
      })
    }
  })
}
