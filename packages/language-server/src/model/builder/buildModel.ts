import type * as c4 from '@likec4/core'
import {
  type MultiMap,
  type ViewId,
  computeColorValues,
  isDeploymentNode,
  isGlobalFqn,
} from '@likec4/core'
import { resolveRulesExtendedViews } from '@likec4/core/compute-view'
import { _stage, _type, FqnRef } from '@likec4/core/types'
import {
  compareNatural,
  parentFqn,
  sortByFqnHierarchically,
} from '@likec4/core/utils'
import type { LangiumDocument } from 'langium'
import {
  filter,
  flatMap,
  forEach,
  indexBy,
  isDefined,
  isNullish,
  isTruthy,
  keys,
  map,
  mapValues,
  pipe,
  prop,
  reduce,
} from 'remeda'
import type {
  ParsedAstView,
  ParsedLikeC4LangiumDocument,
} from '../../ast'
import { logger } from '../../logger'
import { resolveRelativePaths } from '../../view-utils'
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
  project: Project,
  docs: ReadonlyArray<ParsedLikeC4LangiumDocument>,
): BuildModelData {
  const c4Specification = new MergedSpecification(docs)

  const customColors: c4.CustomColorDefinitions = mapValues(
    c4Specification.specs.colors,
    c => computeColorValues(c.color),
  )

  const metadataKeys = new Set<string>()
  const elementExtends = new MergedExtends()
  const deploymentExtends = new MergedExtends()

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
    sortByFqnHierarchically,
    reduce(
      (acc, el) => {
        const parent = parentFqn(el.id)
        if (parent && isNullish(acc[parent])) {
          logger.debug`No parent found for ${el.id}`
          return acc
        }
        acc[el.id] = elementExtends.applyExtended<c4.Element>(el)
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
    sortByFqnHierarchically,
    reduce(
      (acc, el) => {
        const parent = parentFqn(el.id)
        if (parent && isNullish(acc[parent])) {
          logger.debug`No parent found for deployment element ${el.id}`
          return acc
        }
        acc[el.id] = isDeploymentNode(el) ? deploymentExtends.applyExtended<c4.DeploymentNode>(el) : el
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
        ...model,
        [_stage]: 'parsed',
        docUri,
        description,
        title,
        id,
      }
    }
  }

  const parsedViews = pipe(
    docs,
    flatMap(d => map(d.c4Views, toC4View(d))),
    // Resolve relative paths and sort by
    resolveRelativePaths,
  )
  // Add index view if not present
  if (!parsedViews.some(v => v.id === 'index')) {
    parsedViews.unshift({
      [_stage]: 'parsed',
      [_type]: 'element',
      id: 'index' as ViewId,
      title: 'Landscape view',
      description: null,
      tags: null,
      links: null,
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

  const views = pipe(
    parsedViews,
    indexBy(prop('id')),
    resolveRulesExtendedViews,
  )

  return {
    data: {
      [_stage]: 'parsed',
      projectId: project.id,
      project: {
        id: project.id,
        title: project.config.title ?? project.config.name,
      },
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
