import { entries, hasAtLeast, pickBy, unique, values } from 'remeda'
import type { AnyAux, Element, ModelDiff, ModelDiffElementOverlay, ParsedLikeC4ModelData } from '../../types'
import { FqnRef, isDeployedInstance, isGlobalFqn } from '../../types'
import { ancestorsFqn, parentFqn, sortParentsFirst } from '../../utils/fqn'
import { sanitizeGlobals } from './sanitize'

/**
 * Adds the properties of an `extend` in a diff to the element:
 * tags and links are added if missing, metadata keys override existing ones.
 */
export function mergeElementOverlay<A extends AnyAux>(
  element: Element<A>,
  overlay: ModelDiffElementOverlay<A>,
): Element<A> {
  const tags = unique([...(element.tags ?? []), ...(overlay.tags ?? [])])
  const currentLinks = element.links ?? []
  const links = [
    ...currentLinks,
    ...(overlay.links ?? []).filter(link =>
      !currentLinks.some(existing => existing.url === link.url && (existing.title ?? '') === (link.title ?? ''))
    ),
  ]
  const metadata = overlay.metadata ? { ...element.metadata, ...overlay.metadata } : element.metadata
  return {
    ...element,
    ...(hasAtLeast(tags, 1) && { tags }),
    ...(hasAtLeast(links, 1) && { links }),
    ...(metadata && { metadata }),
  }
}

/**
 * Applies the diff to the model and returns the model after the change ("to-be" state).
 *
 * Requires: `data` is the model before any diff is applied.
 * Guarantees:
 * - removed elements take their descendants, relationships and deployed instances with them
 * - an added element is skipped if its parent does not exist
 * - an added relationship is skipped if one of its endpoints does not exist
 * - global predicates and styles reference only existing elements
 * - a dynamic view introduced by the diff is added when its id is not already in the model
 */
export function applyModelDiff<A extends AnyAux>(
  data: ParsedLikeC4ModelData<A>,
  diff: ModelDiff<A>,
): ParsedLikeC4ModelData<A> {
  const removed = new Set<string>(diff.remove.elements)
  const isRemoved = (fqn: string) => removed.has(fqn) || ancestorsFqn(fqn).some(ancestor => removed.has(ancestor))

  const elements = {} as ParsedLikeC4ModelData<A>['elements']
  for (const element of values(data.elements)) {
    if (!isRemoved(element.id)) {
      elements[element.id] = element
    }
  }
  for (const element of sortParentsFirst(values(diff.add.elements))) {
    const parent = parentFqn(element.id)
    if (parent && !(parent in elements)) {
      continue
    }
    elements[element.id] = element
  }
  for (const [id, overlay] of entries(diff.modify.elements)) {
    const element = elements[id]
    if (element) {
      elements[id] = mergeElementOverlay(element, overlay)
    }
  }

  const exists = (ref: FqnRef.ModelRef<A>) => {
    const fqn = FqnRef.flatten(ref)
    return isGlobalFqn(fqn) || fqn in elements
  }
  const removedRelations = new Set<string>(diff.remove.relations)
  const relations = {} as ParsedLikeC4ModelData<A>['relations']
  for (const relation of [...values(data.relations), ...values(diff.add.relations)]) {
    if (removedRelations.has(relation.id) || !exists(relation.source) || !exists(relation.target)) {
      continue
    }
    relations[relation.id] = relation
  }

  const deploymentElements = {} as ParsedLikeC4ModelData<A>['deployments']['elements']
  for (const element of values(data.deployments.elements)) {
    if (!(isDeployedInstance(element) && isRemoved(element.element))) {
      deploymentElements[element.id] = element
    }
  }
  const isValidDeploymentRef = (ref: FqnRef.DeploymentRef<A>) =>
    ref.deployment in deploymentElements && !(ref.element && isRemoved(ref.element))
  const deploymentRelations = pickBy(
    data.deployments.relations,
    relation => isValidDeploymentRef(relation.source) && isValidDeploymentRef(relation.target),
  )

  const views = { ...data.views }
  for (const view of values(diff.views ?? {})) {
    if (!(view.id in views)) {
      views[view.id] = view
    }
  }

  return {
    ...data,
    elements,
    relations,
    views,
    deployments: {
      elements: deploymentElements,
      relations: deploymentRelations,
    },
    globals: sanitizeGlobals(data.globals, fqn => !(fqn in elements)),
  }
}

/**
 * Returns FQNs of elements that exist only in diffs (not in the model before any diff is applied).
 */
export function diffOnlyElements<A extends AnyAux>(data: ParsedLikeC4ModelData<A>): ReadonlySet<string> {
  return new Set(
    values(data.diffs ?? {})
      .flatMap(diff => Object.keys(diff.add.elements))
      .filter(fqn => !(fqn in data.elements)),
  )
}
