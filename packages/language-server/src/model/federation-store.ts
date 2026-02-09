import type { Fqn, ProjectId } from '@likec4/core'
import type { FederationManifest } from '@likec4/core/types'
import { URI } from 'langium'
import type { AstNodeDescriptionWithFqn } from '../ast'

const FEDERATION_SCHEME = 'federation'
const idSymbol = Symbol.for('idattr')

/**
 * Stores resolved federation manifests and creates synthetic
 * AstNodeDescriptions for federated elements so that the FqnIndex
 * and scope provider can resolve references to them.
 */
export class FederationStore {
  #manifests = new Map<string, FederationManifest>()
  #descCache = new Map<string, AstNodeDescriptionWithFqn[]>()

  setManifest(projectName: string, manifest: FederationManifest): void {
    this.#manifests.set(projectName, manifest)
    this.#descCache.delete(projectName)
  }

  getManifest(projectName: string): FederationManifest | undefined {
    return this.#manifests.get(projectName)
  }

  hasManifest(projectName: string): boolean {
    return this.#manifests.has(projectName)
  }

  get manifestProjectIds(): string[] {
    return [...this.#manifests.keys()]
  }

  clear(): void {
    this.#manifests.clear()
    this.#descCache.clear()
  }

  private getDescriptions(projectName: string): AstNodeDescriptionWithFqn[] {
    let descs = this.#descCache.get(projectName)
    if (descs) return descs

    const manifest = this.#manifests.get(projectName)
    if (!manifest) return []

    descs = []
    const documentUri = URI.parse(`${FEDERATION_SCHEME}://${projectName}/manifest.json`)

    for (const fqnStr of Object.keys(manifest.elements)) {
      const fqn = fqnStr as Fqn
      const name = fqn.includes('.') ? fqn.split('.').pop()! : fqn

      // Create synthetic element node that passes ast.isElement() checks
      // and has the FQN stored via the LikeC4.ID symbol
      const syntheticNode: Record<string | symbol, unknown> = {
        $type: 'Element',
        name,
        [idSymbol]: fqn,
      }

      descs.push({
        type: 'Element',
        name,
        documentUri,
        path: `/elements/${fqnStr}`,
        node: syntheticNode as any,
        id: fqn,
        likec4ProjectId: projectName as ProjectId,
      })
    }

    this.#descCache.set(projectName, descs)
    return descs
  }

  rootElements(projectName: string): AstNodeDescriptionWithFqn[] {
    return this.getDescriptions(projectName)
      .filter(d => !d.id.includes('.'))
  }

  directChildrenOf(projectName: string, parent: Fqn): AstNodeDescriptionWithFqn[] {
    const prefix = `${parent}.`
    return this.getDescriptions(projectName)
      .filter(d => d.id.startsWith(prefix) && !d.id.slice(prefix.length).includes('.'))
  }

  uniqueDescendants(projectName: string, parent: Fqn): AstNodeDescriptionWithFqn[] {
    const prefix = `${parent}.`
    return this.getDescriptions(projectName)
      .filter(d => d.id.startsWith(prefix))
  }

  byFqn(projectName: string, fqn: Fqn): AstNodeDescriptionWithFqn[] {
    return this.getDescriptions(projectName)
      .filter(d => d.id === fqn)
  }

  /**
   * Get all element records from a federation manifest, suitable for
   * injecting into ParsedLikeC4ModelData.imports.
   */
  getElementsForImport(projectName: string, fqns: Iterable<Fqn>): import('@likec4/core/types').Element<any>[] {
    const manifest = this.#manifests.get(projectName)
    if (!manifest) return []

    const fqnSet = new Set(fqns)
    const elements: import('@likec4/core/types').Element<any>[] = []
    for (const fqn of fqnSet) {
      const el = manifest.elements[fqn]
      if (el) {
        elements.push(el)
      }
    }
    return elements
  }
}
