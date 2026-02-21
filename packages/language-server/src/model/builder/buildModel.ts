// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type * as c4 from '@likec4/core'
import {
  type MultiMap,
  type ViewId,
  isDeploymentNode,
  isGlobalFqn,
} from '@likec4/core'
import { resolveRulesExtendedViews } from '@likec4/core/compute-view'
import { computeColorValues } from '@likec4/core/styles'
import { _stage, _type, exact, FqnRef, isExtendsElementView } from '@likec4/core/types'
import {
  compareNatural,
  parentFqn,
  sortParentsFirst,
} from '@likec4/core/utils'
import { type LangiumDocument, UriUtils } from 'langium'
import {
  filter,
  flatMap,
  forEach,
  hasAtLeast,
  indexBy,
  isDefined,
  isEmpty,
  isNullish,
  isTruthy,
  keys,
  map,
  mapValues,
  omitBy,
  pipe,
  prop,
  reduce,
  unique,
} from 'remeda'
import type {
  ParsedAstView,
  ParsedLikeC4LangiumDocument,
} from '../../ast'
import { logger } from '../../logger'
import type { LikeC4Services } from '../../module'
import { stringHash } from '../../utils/stringHash'
import type { Project } from '../../workspace/ProjectsManager'
import { MergedExtends } from './MergedExtends'
import { MergedSpecification } from './MergedSpecification'

export type BuildModelData = {
  data: c4.ParsedLikeC4ModelData
  imports: MultiMap<c4.ProjectId, c4.Fqn, Set<c4.Fqn>>
}

/**
 * Each document was parsed into a ParsedLikeC4LangiumDocument, where elements
 * do not inherit styles from specification.
 *
 * This function builds a model from all documents, merging the specifications
 * and globals, and applying the extends to the elements.
 */
export function buildModelData(
  services: LikeC4Services,
  project: Project,
  docs: ReadonlyArray<ParsedLikeC4LangiumDocument>,
): BuildModelData {
  const c4Specification = new MergedSpecification(docs, {
    inferTechFromIcon: project.config.inferTechnologyFromIcon ?? true,
  })

  if (c4Specification.projectId === project.id) {
    services.likec4.LastSeen.rememberSpecification(c4Specification)
  }

  const customColors: c4.CustomColorDefinitions = mapValues(
    c4Specification.specs.colors,
    c => computeColorValues(c.color),
  )

  const metadataKeys = new Set<string>()
  const elementExtends = new MergedExtends()
  const deploymentExtends = new MergedExtends()

  // Collect all relation extends - we'll match them by comparing source/target/kind/title
  const relationExtends = docs.flatMap(doc => doc.c4ExtendRelations)
  const matchedExtendIds = new Set<string>()

  const scanMetadataKeys = (obj?: { metadata?: Record<string, unknown> }) => {
    if (obj?.metadata) {
      keys(obj.metadata).forEach(key => metadataKeys.add(key))
    }
  }

  const elements = pipe(
    docs,
    flatMap(d => {
      elementExtends.merge(d.c4ExtendElements)
      return map(d.c4Elements, c4Specification.toModelElement)
    }),
    filter(isTruthy),
    // sort from root elements to nested, so that parent is always present
    // Import to preserve the order from the source
    sortParentsFirst,
    reduce(
      (acc, el) => {
        const parent = parentFqn(el.id)
        if (parent && isNullish(acc[parent])) {
          logger.debug`No parent found for ${el.id}`
          return acc
        }
        acc[el.id] = elementExtends.applyExtended(el)
        scanMetadataKeys(acc[el.id])
        return acc
      },
      {} as c4.ParsedLikeC4ModelData['elements'],
    ),
  )

  const relations = pipe(
    docs,
    flatMap(d => map(d.c4Relations, c4Specification.toModelRelation)),
    filter((rel): rel is c4.Relationship => {
      if (!rel) return false
      const source = FqnRef.flatten(rel.source),
        target = FqnRef.flatten(rel.target)

      if (
        (isNullish(elements[source]) && !isGlobalFqn(source)) ||
        (isNullish(elements[target]) && !isGlobalFqn(target))
      ) {
        logger.debug`Invalid relation ${rel.id}
  source: ${source} resolved: ${!!elements[source]}
  target: ${target} resolved: ${!!elements[target]}\n`
        return false
      }
      return true
    }),
    map(rel => {
      // Apply relation extends by matching source, target, kind, and title
      // Generate a stable match key for this relation
      const matchKey = stringHash(
        'extend-relation',
        FqnRef.flatten(rel.source),
        FqnRef.flatten(rel.target),
        rel.kind ?? 'default',
        rel.title ?? '',
      )

      // Find all extends that match this relation
      const relExtends = relationExtends.filter(ext => ext.id === matchKey)
      if (relExtends.length === 0) {
        return rel
      }

      // Mark these extends as matched
      relExtends.forEach(ext => matchedExtendIds.add(ext.astPath))

      // Merge all extends for this relation
      const tags = rel.tags ? [...rel.tags] : []
      const links = rel.links ? [...rel.links] : []
      let metadata = rel.metadata ? { ...rel.metadata } : {}

      for (const ext of relExtends) {
        if (ext.tags) {
          tags.push(...ext.tags)
        }
        if (ext.links) {
          // Ensure links are unique based on both URL and title
          for (const incomingLink of ext.links) {
            const isDuplicate = links.some(existingLink =>
              existingLink.url === incomingLink.url && (existingLink.title || '') === (incomingLink.title || '')
            )
            if (!isDuplicate) {
              links.push(incomingLink)
            }
          }
        }
        if (ext.metadata) {
          for (const [key, value] of Object.entries(ext.metadata)) {
            const existingValue = metadata[key]
            if (existingValue === undefined) {
              metadata[key] = value
            } else {
              const existingArray = Array.isArray(existingValue) ? existingValue : [existingValue]
              const incomingArray = Array.isArray(value) ? value : [value]
              const merged = unique([...existingArray, ...incomingArray])
              metadata[key] = merged.length === 1 ? merged[0]! : merged
            }
          }
        }
      }

      // Apply unique after accumulating all values
      const uniqueTags = unique(tags)
      // Links are already de-duplicated by URL and title in the loop above
      const uniqueLinks = links

      return {
        ...rel,
        ...(hasAtLeast(uniqueTags, 1) && { tags: uniqueTags }),
        ...(hasAtLeast(uniqueLinks, 1) && { links: uniqueLinks }),
        ...(!isEmpty(metadata) && { metadata }),
      }
    }),
    forEach(scanMetadataKeys),
    indexBy(prop('id')),
  )

  const deploymentElements = pipe(
    docs,
    flatMap(d => {
      deploymentExtends.merge(d.c4ExtendDeployments)
      return map(d.c4Deployments, c4Specification.toDeploymentElement)
    }),
    filter(isTruthy),
    // sort from root elements to nested, so that parent is always present
    // Import to preserve the order from the source
    sortParentsFirst,
    reduce(
      (acc, el) => {
        const parent = parentFqn(el.id)
        if (parent && isNullish(acc[parent])) {
          logger.debug`No parent found for deployment element ${el.id}`
          return acc
        }
        acc[el.id] = isDeploymentNode(el) ? deploymentExtends.applyExtended(el) : el
        scanMetadataKeys(acc[el.id])
        return acc
      },
      {} as Record<string, c4.DeploymentElement>,
    ),
  )

  const deploymentRelations = pipe(
    docs,
    flatMap(d => map(d.c4DeploymentRelations, c4Specification.toDeploymentRelation)),
    filter((rel): rel is c4.DeploymentRelationship => {
      if (!rel) return false
      if (
        isNullish(deploymentElements[rel.source.deployment]) || isNullish(deploymentElements[rel.target.deployment])
      ) {
        logger.debug`Invalid deployment relation ${rel.id}
  source: ${rel.source.deployment} resolved: ${!!deploymentElements[rel.source.deployment]}
  target: ${rel.target.deployment} resolved: ${!!deploymentElements[rel.target.deployment]}\n`
        return false
      }
      return true
    }),
    reduce(
      (acc, el) => {
        if (isDefined(acc[el.id])) {
          logger.debug`Duplicate deployment relation ${el.id}`
          return acc
        }
        scanMetadataKeys(el)
        acc[el.id] = el
        return acc
      },
      {} as Record<string, c4.DeploymentRelationship>,
    ),
  )

  function toC4View(doc: LangiumDocument) {
    const docUri = doc.uri.toString()
    return (parsedAstView: ParsedAstView): c4.LikeC4View => {
      let {
        id,
        title,
        description,
        // ignore this property
        astPath: _ignore,
        // model should include discriminant __
        ...model
      } = parsedAstView

      if (parsedAstView[_type] === 'element' && isNullish(title) && 'viewOf' in parsedAstView) {
        title = elements[parsedAstView.viewOf]?.title ?? null
      }

      if (isNullish(title) && id === 'index') {
        title = 'Landscape view'
      }

      return {
        ...omitBy(model, v => v === undefined),
        [_stage]: 'parsed',
        sourcePath: UriUtils.relative(project.folderUri, docUri),
        docUri,
        description,
        title,
        id,
      }
    }
  }

  const parsedViews = docs.flatMap(d => map(d.c4Views, toC4View(d)))

  // Add index view if not present
  if (!parsedViews.some(v => v.id === 'index')) {
    parsedViews.unshift({
      [_stage]: 'parsed',
      [_type]: 'element',
      id: 'index' as ViewId,
      title: 'Landscape view',
      description: null,
      rules: [
        {
          include: [
            {
              wildcard: true,
            },
          ],
        },
      ],
    })
  }

  // Add implicit scoped views for elements without explicit views
  if (project.config.implicitViews !== false) {
    const elementsWithExplicitViews = new Set<string>()
    for (const v of parsedViews) {
      if (v[_type] === 'element' && 'viewOf' in v && v.viewOf) {
        elementsWithExplicitViews.add(v.viewOf as string)
      }
    }
    const existingViewIds = new Set(parsedViews.map(v => v.id as string))

    for (const fqn of keys(elements)) {
      if (
        elementsWithExplicitViews.has(fqn)
        || isGlobalFqn(fqn)
      ) {
        continue
      }
      const viewId = ('__' + fqn.replaceAll('.', '_')) as ViewId
      if (existingViewIds.has(viewId)) {
        continue
      }
      existingViewIds.add(viewId)
      parsedViews.push({
        [_stage]: 'parsed',
        [_type]: 'element',
        id: viewId,
        viewOf: fqn as c4.Fqn,
        title: `Auto / ${elements[fqn]?.title ?? fqn}`,
        description: null,
        rules: [
          {
            include: [
              {
                wildcard: true,
              },
            ],
          },
        ],
      })
    }
  }

  let views = pipe(
    parsedViews,
    indexBy(prop('id')),
  )
  if (parsedViews.some(isExtendsElementView)) {
    views = resolveRulesExtendedViews(views)
  }

  // Warn about unmatched relation extends
  for (const ext of relationExtends) {
    if (!matchedExtendIds.has(ext.astPath)) {
      logger.warn(`Relation extend at ${ext.astPath} does not match any relation in the model`)
    }
  }

  return {
    data: {
      [_stage]: 'parsed',
      projectId: project.id,
      project: exact({
        id: project.id,
        title: project.config.title ?? project.config.name,
        styles: project.config.styles,
        manualLayouts: project.config.manualLayouts,
        inferTechnologyFromIcon: project.config.inferTechnologyFromIcon,
      }),
      specification: {
        tags: c4Specification.tags,
        elements: c4Specification.specs.elements,
        relationships: mapValues(c4Specification.specs.relationships, ({ notation, technology, ...style }) => ({
          ...(notation && { notation }),
          ...(technology && { technology }),
          style,
        })),
        deployments: c4Specification.specs.deployments,
        ...(metadataKeys.size > 0 && { metadataKeys: [...metadataKeys].sort(compareNatural) }),
        customColors,
      },
      elements,
      relations,
      globals: c4Specification.globals,
      views,
      deployments: {
        elements: deploymentElements,
        relations: deploymentRelations,
      },
      imports: {},
    },
    imports: c4Specification.imports,
  }
}
