export {
  type BreakingChange,
  checkComposition,
  type CompositionCheckResult,
} from './composition-check'
export {
  createFederatedRegistry,
  type FederatedRegistryReader,
  type FederatedRegistryWriter,
} from './federated-registry'
export { buildManifest, type ManifestBuildOptions } from './manifest'
export { createLocalRegistry, type RegistryReader } from './registry'
export { type ResolvedDependencies, resolveDependencies, type ResolveOptions } from './resolve'
export {
  compareSemVer,
  findBestMatch,
  parseRange,
  parseSemVer,
  satisfies,
  type SemVer,
  type SemVerRange,
  semVerToString,
} from './version'
