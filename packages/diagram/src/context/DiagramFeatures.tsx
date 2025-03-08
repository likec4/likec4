import type { ExclusiveUnion, NonEmptyArray } from '@likec4/core'
import { shallowEqual } from 'fast-equals'
import { type PropsWithChildren, createContext, useContext, useEffect, useState } from 'react'
import { map, mapToObj, pick } from 'remeda'

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
  'FitView',
  /**
   * LikeC4Model is available in context
   */
  'LikeC4Model',
  /**
   * Running in VSCode
   */
  'Vscode',
] as const
export type FeatureName = typeof FeatureNames[number]
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
    enableReadOnly,
    enableLikeC4Model,
    enableElementDetails,
    enableRelationshipDetails,
    enableRelationshipBrowser,
    enableSearch,
    enableEdgeEditing,
    ...rest
  } = features
  if (!enableLikeC4Model) {
    enableElementDetails = false
    enableRelationshipDetails = false
    enableRelationshipBrowser = false
    enableSearch = false
  }

  if (enableReadOnly) {
    enableEdgeEditing = false
  }

  return {
    enableReadOnly,
    enableLikeC4Model,
    enableElementDetails,
    enableRelationshipDetails,
    enableRelationshipBrowser,
    enableSearch,
    enableEdgeEditing,
    ...rest,
  }
}

export function DiagramFeatures({
  children,
  features,
  overrides,
}: PropsWithChildren<
  ExclusiveUnion<{
    features: {
      features: EnabledFeatures
    }
    overrides: {
      overrides: Partial<EnabledFeatures>
    }
  }>
>) {
  const outerScope = useContext(DiagramFeaturesContext)
  const [scope, setScope] = useState(outerScope)

  useEffect(
    () => {
      setScope(current => {
        const next = validate({
          ...outerScope,
          ...features,
          ...overrides,
        })
        return shallowEqual(current, next) ? current : next
      })
    },
    [outerScope, features, overrides],
  )

  return (
    <DiagramFeaturesContext.Provider value={scope}>
      {children}
    </DiagramFeaturesContext.Provider>
  )
}

DiagramFeatures.Overlays = ({ children }: PropsWithChildren) => {
  return (
    <DiagramFeatures
      overrides={{
        enableControls: false,
        enableReadOnly: true,
        enableEdgeEditing: false,
      }}>
      {children}
    </DiagramFeatures>
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
  const enabled = useEnabledFeature(feature)[`enable${feature}`] === true
  return enabled && and ? <>{children}</> : null
}

export function IfNotEnabled({
  feature,
  children,
}: PropsWithChildren<{ feature: FeatureName }>) {
  const notEnabled = useEnabledFeature(feature)[`enable${feature}`] !== true
  return notEnabled ? <>{children}</> : null
}
