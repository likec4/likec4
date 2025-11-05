import { isTruthy } from 'remeda'

type FeatureFlagState = {
  dynamicBranchCollections: boolean
}

type FeatureFlagName = keyof FeatureFlagState

// Check both LIKEC4_UNIFIED_BRANCHES (preferred) and LIKEC4_EXPERIMENTAL_UNIFIED_BRANCHES (legacy)
// for backward compatibility during migration period.
// LIKEC4_EXPERIMENTAL_UNIFIED_BRANCHES will be removed in a future version.
const dynamicBranchCollectionsEnv = typeof process !== 'undefined' && process?.env
  ? process.env['LIKEC4_UNIFIED_BRANCHES'] ?? process.env['LIKEC4_EXPERIMENTAL_UNIFIED_BRANCHES']
  : undefined

const initialState: FeatureFlagState = {
  dynamicBranchCollections: isTruthy(dynamicBranchCollectionsEnv)
    ? /^[ty1]/i.test(dynamicBranchCollectionsEnv)
    : false,
}

const mutableState: FeatureFlagState = { ...initialState }

export const featureFlags: FeatureFlagState = new Proxy(mutableState, {
  get(target, prop: FeatureFlagName) {
    return target[prop]
  },
}) as FeatureFlagState

export function isFeatureEnabled(flag: FeatureFlagName): boolean {
  return featureFlags[flag]
}

export function isDynamicBranchCollectionsEnabled(): boolean {
  return featureFlags.dynamicBranchCollections
}

export function setFeatureFlag(flag: FeatureFlagName, enabled: boolean): void {
  mutableState[flag] = enabled
}

export function enableDynamicBranchCollections(): void {
  setFeatureFlag('dynamicBranchCollections', true)
}

export function disableDynamicBranchCollections(): void {
  setFeatureFlag('dynamicBranchCollections', false)
}
