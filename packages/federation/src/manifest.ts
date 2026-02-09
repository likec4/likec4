import type { FederationConfig } from '@likec4/config'
import type { LikeC4Model } from '@likec4/core/model'
import type {
  AnyAux,
  ComputedView,
  Element,
  FederationManifest,
  ProjectDump,
  Relationship,
  SpecificationDump,
} from '@likec4/core/types'
import type { Any } from '@likec4/core/types'

export interface ManifestBuildOptions {
  /** Semver version for this manifest (optional for federated registries) */
  version?: string | undefined
}

/**
 * Build a FederationManifest from a LikeC4Model and federation config.
 *
 * Filters elements to only those matching export patterns,
 * includes relationships where both source and target are exported,
 * and includes specified views.
 */
export function buildManifest<A extends Any>(
  model: LikeC4Model<A>,
  config: FederationConfig,
  options: ManifestBuildOptions,
): FederationManifest {
  const exportPatterns = config.exports ?? []
  const exportViewIds = config.exportViews ?? []

  // Collect exported elements
  const elements: Record<string, Element<AnyAux>> = {}
  const exportedFqns = new Set<string>()

  for (const el of model.elements()) {
    const fqn = el.id as string
    if (matchesAnyPattern(fqn, exportPatterns)) {
      elements[fqn] = el.$element as Element<AnyAux>
      exportedFqns.add(fqn)
    }
  }

  // Collect relationships where both source and target are exported
  const relations: Record<string, Relationship<AnyAux>> = {}
  for (const rel of model.relationships()) {
    const sourceRef = rel.$relationship.source
    const targetRef = rel.$relationship.target
    // FqnRef.ModelRef has a `model` property that holds the element FQN
    const sourceFqn = sourceRef.model as string
    const targetFqn = targetRef.model as string
    if (exportedFqns.has(sourceFqn) && exportedFqns.has(targetFqn)) {
      relations[rel.id] = rel.$relationship as Relationship<AnyAux>
    }
  }

  // Collect exported views
  const views: Record<string, ComputedView<AnyAux>> | undefined = exportViewIds.length > 0 ? {} : undefined

  if (views) {
    for (const viewId of exportViewIds) {
      try {
        const vm = model.view(viewId as any)
        views[viewId] = vm.$view as ComputedView<AnyAux>
      } catch {
        // View not found — skip silently
      }
    }
  }

  // Build specification subset
  const spec = model.$data.specification as unknown as SpecificationDump

  // Build project metadata
  const project: ProjectDump = {
    id: model.$data.projectId as string,
    name: model.$data.project?.title ?? (model.$data.projectId as string),
  }

  const manifest: FederationManifest = {
    schema: 'likec4/federation/v1',
    name: model.$data.projectId as string,
    specification: spec,
    elements,
    relations,
    ...(views && Object.keys(views).length > 0 ? { views } : {}),
    project,
  }
  if (options.version) {
    manifest.version = options.version
  }
  return manifest
}

/**
 * Check if a fully qualified name matches any of the given patterns.
 * Supports exact match and prefix match (pattern matches if FQN starts with pattern + '.').
 */
function matchesAnyPattern(fqn: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    if (fqn === pattern || fqn.startsWith(pattern + '.')) {
      return true
    }
  }
  return false
}
