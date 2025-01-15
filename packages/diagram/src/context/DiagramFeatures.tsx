import type { NonEmptyArray } from '@likec4/core'
import { type PropsWithChildren, createContext, useContext, useState } from 'react'
import { map, mapToObj, pick } from 'remeda'
import { useUpdateEffect } from '../hooks'

const FeatureNames = [
  'Controls',
  'ReadOnly',
  'FocusMode',
  'NavigateTo',
  'ElementDetails',
  'RelationshipDetails',
  'RelationshipBrowser',
  'Search',
  'NavigationButtons',
  'Notations',
  'DynamicViewWalkthrough',
  'EdgeEditing',
  'ViewTitle',
  /**
   * LikeC4Model is available in context
   */
  'LikeC4Model',
  /**
   * Running in VSCode
   */
  'Vscode',
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

const validate = (features: EnabledFeatures) => {
  let {
    enableLikeC4Model,
    enableElementDetails,
    enableRelationshipDetails,
    enableRelationshipBrowser,
    enableSearch,
    ...rest
  } = features
  if (!enableLikeC4Model) {
    if (enableElementDetails) {
      console.warn('enableElementDetails is ignored because requires LikeC4Model')
      enableElementDetails = false
    }
    if (enableRelationshipDetails) {
      console.warn('enableRelationshipDetails is ignored because requires enableLikeC4Model')
      enableRelationshipDetails = false
    }
    if (enableRelationshipBrowser) {
      console.warn('enableRelationshipBrowser is ignored because requires LikeC4Model')
      enableRelationshipBrowser = false
    }
    if (enableSearch) {
      console.warn('enableSearch is ignored because requires LikeC4Model')
      enableSearch = false
    }
  }

  return {
    ...rest,
    enableLikeC4Model,
    enableElementDetails,
    enableRelationshipDetails,
    enableRelationshipBrowser,
    enableSearch,
  }
}

export function DiagramFeatures({
  children,
  features,
}: PropsWithChildren<{ features: EnabledFeatures }>) {
  const [enabled, setFeatures] = useState(() => validate(features))

  useUpdateEffect(() => {
    setFeatures(validate({
      ...AllDisabled,
      ...features,
    }))
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
