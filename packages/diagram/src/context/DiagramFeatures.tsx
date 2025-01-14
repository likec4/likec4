import type { NonEmptyArray } from '@likec4/core'
import { type PropsWithChildren, createContext, useContext, useState } from 'react'
import { map, mapToObj, pick } from 'remeda'
import { useUpdateEffect } from '../hooks'

const FeatureNames = [
  'FocusMode',
  'NavigateTo',
  'ElementDetails',
  'RelationshipDetails',
  'RelationshipBrowser',
  'Search',
  'NavigationButtons',
] as const
type FeatureName = typeof FeatureNames[number]
export type EnabledFeatures = {
  [P in `enable${FeatureName}`]: boolean
}

export const AllDisabled: EnabledFeatures = mapToObj(
  FeatureNames,
  (name) => [`enable${name}`, false] as const,
)
const DiagramFeaturesContext = createContext<EnabledFeatures>(AllDisabled)

const isEnabled = (features: EnabledFeatures, name: FeatureName) => features[`enable${name}`]

export function DiagramFeatures({
  children,
  features,
}: PropsWithChildren<{ features: EnabledFeatures }>) {
  const [enabled, setFeatures] = useState(features)

  useUpdateEffect(() => {
    setFeatures({
      ...AllDisabled,
      ...features,
    })
  }, [features])

  return (
    <DiagramFeaturesContext.Provider value={enabled}>
      {children}
    </DiagramFeaturesContext.Provider>
  )
}

export function useEnabledFeature<F extends NonEmptyArray<FeatureName>>(
  ...names: F
): { [P in `enable${F[number]}`]: boolean } {
  return pick(useContext(DiagramFeaturesContext), map(names, (name) => `enable${name}` as const))
}

export function useEnabledFeatures(): EnabledFeatures {
  return useContext(DiagramFeaturesContext)
}

export function IfEnabled({
  feature,
  children,
  and = true,
}: PropsWithChildren<{ feature: FeatureName; and?: boolean }>) {
  const enabled = useEnabledFeature(feature)
  return enabled && and ? <>{children}</> : null
}
