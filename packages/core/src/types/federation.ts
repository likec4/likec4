import type { AnyAux } from './_aux'
import type { ProjectDump, SpecificationDump } from './model-dump'
import type { Element, Relationship } from './model-logical'
import type { ComputedView } from './view'

export type FederationManifestSchema = 'likec4/federation/v1'

export interface FederationManifest {
  /** Manifest schema version for forward compatibility */
  schema: FederationManifestSchema
  /** Project name */
  name: string
  /** Semver version (optional in versionless registries) */
  version?: string | undefined
  /** Specifications (element kinds, tags, relationship kinds) */
  specification: SpecificationDump
  /** Exported elements keyed by FQN */
  elements: Record<string, Element<AnyAux>>
  /** Relationships between exported elements */
  relations: Record<string, Relationship<AnyAux>>
  /** Optionally exported computed views */
  views?: Record<string, ComputedView<AnyAux>>
  /** Project metadata */
  project: ProjectDump
}

export type FederationRegistrySchema = 'likec4/registry/v1'

export interface RegistryProviderEntry {
  lastPublished: string
}

export interface RegistryConsumerEntry {
  imports: Record<string, string[]>
}

export interface FederationRegistry {
  schema: FederationRegistrySchema
  providers: Record<string, RegistryProviderEntry>
  consumers: Record<string, RegistryConsumerEntry>
}
