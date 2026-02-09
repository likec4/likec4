import type { FederationManifest, FederationRegistry } from '@likec4/core/types'

export interface BreakingChange {
  consumer: string
  missingFqns: string[]
}

export interface CompositionCheckResult {
  ok: boolean
  breakingChanges: BreakingChange[]
}

/**
 * Check if publishing a new manifest would break any consumers.
 *
 * Reads the registry to find all consumers that import from the given provider,
 * then checks that every imported FQN exists in the new manifest's elements.
 */
export function checkComposition(
  providerName: string,
  newManifest: FederationManifest,
  registry: FederationRegistry,
): CompositionCheckResult {
  const breakingChanges: BreakingChange[] = []
  const elementFqns = new Set(Object.keys(newManifest.elements))

  for (const [consumerName, consumer] of Object.entries(registry.consumers)) {
    const importedFqns = consumer.imports[providerName]
    if (!importedFqns || importedFqns.length === 0) {
      continue
    }

    const missingFqns = importedFqns.filter(fqn => !elementFqns.has(fqn))
    if (missingFqns.length > 0) {
      breakingChanges.push({ consumer: consumerName, missingFqns })
    }
  }

  return {
    ok: breakingChanges.length === 0,
    breakingChanges,
  }
}
