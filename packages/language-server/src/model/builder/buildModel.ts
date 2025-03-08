import type * as c4 from '@likec4/core'
import {
  type ViewId,
  computeColorValues,
  DeploymentElement,
  parentFqn,
  sortByFqnHierarchically,
} from '@likec4/core'
import { resolveRulesExtendedViews } from '@likec4/core/compute-view'
import type { LangiumDocument } from 'langium'
import {
  filter,
  flatMap,
  indexBy,
  isDefined,
  isNullish,
  isTruthy,
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
import { MergedExtends } from './MergedExtends'
import { MergedSpecification } from './MergedSpecification'

export function buildModel(docs: ParsedLikeC4LangiumDocument[]): c4.ParsedLikeC4ModelData {
  // Merge specifications and globals from all documents
  const c4Specification = new MergedSpecification(docs)

  const customColorDefinitions: c4.CustomColorDefinitions = mapValues(
    c4Specification.specs.colors,
    c => computeColorValues(c.color),
  )

  const elementExtends = new MergedExtends()
  const deploymentExtends = new MergedExtends()

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
        acc[el.id] = elementExtends.apply(el)
        return acc
      },
      {} as c4.ParsedLikeC4ModelData['elements'],
    ),
  )

  const relations = pipe(
    docs,
    flatMap(d => map(d.c4Relations, c4Specification.toModelRelation)),
    filter((rel): rel is c4.ModelRelation => {
      if (!rel) return false
      if (isNullish(elements[rel.source]) || isNullish(elements[rel.target])) {
        logger.debug`Invalid relation ${rel.id}
  source: ${rel.source} resolved: ${!!elements[rel.source]}
  target: ${rel.target} resolved: ${!!elements[rel.target]}\n`
        return false
      }
      return true
    }),
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
        acc[el.id] = DeploymentElement.isDeploymentNode(el) ? deploymentExtends.apply(el) : el
        return acc
      },
      {} as Record<string, c4.DeploymentElement>,
    ),
  )

  const deploymentRelations = pipe(
    docs,
    flatMap(d => map(d.c4DeploymentRelations, c4Specification.toDeploymentRelation)),
    filter((rel): rel is c4.DeploymentRelation => {
      if (!rel) return false
      if (isNullish(deploymentElements[rel.source.id]) || isNullish(deploymentElements[rel.target.id])) {
        logger.debug`Invalid deployment relation ${rel.id}
  source: ${rel.source.id} resolved: ${!!deploymentElements[rel.source.id]}
  target: ${rel.target.id} resolved: ${!!deploymentElements[rel.target.id]}\n`
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
        acc[el.id] = el
        return acc
      },
      {} as Record<string, c4.DeploymentRelation>,
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

      if (parsedAstView.__ === 'element' && isNullish(title) && 'viewOf' in parsedAstView) {
        title = elements[parsedAstView.viewOf]?.title ?? null
      }

      if (isNullish(title) && id === 'index') {
        title = 'Landscape view'
      }

      return {
        ...model,
        customColorDefinitions,
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
      __: 'element',
      id: 'index' as ViewId,
      title: 'Landscape view',
      description: null,
      tags: null,
      links: null,
      customColorDefinitions: customColorDefinitions,
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
    specification: {
      tags: Array.from(c4Specification.specs.tags),
      elements: c4Specification.specs.elements,
      relationships: c4Specification.specs.relationships,
      deployments: c4Specification.specs.deployments,
    },
    elements,
    relations,
    globals: c4Specification.globals,
    views,
    deployments: {
      elements: deploymentElements,
      relations: deploymentRelations,
    },
  }
}
