import type { ExclusiveUnion, NonEmptyArray } from '@likec4/core'
import { useCustomCompareEffect } from '@react-hookz/web'
import { type PropsWithChildren, createContext, useContext, useState } from 'react'
import { map, mapToObj, pick } from 'remeda'
import { depsShallowEqual } from '../hooks'

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
    enableReadOnly,
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
  if (enableReadOnly) {
    if (rest.enableEdgeEditing) {
      console.warn('enableEdgeEditing is ignored because enabled ReadOnly')
      rest.enableEdgeEditing = false
    }
  }

  return {
    ...rest,
    enableReadOnly,
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
  const scope = useContext(DiagramFeaturesContext)
  const [enabled, setFeatures] = useState(scope)

  useCustomCompareEffect(
    () => {
      setFeatures(validate({
        ...scope,
        ...features,
        ...overrides,
      }))
    },
    [scope, features, overrides],
    depsShallowEqual,
  )

  return (
    <DiagramFeaturesContext.Provider value={enabled}>
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
