import type { ExclusiveUnion } from '@likec4/core/types'
import { shallowEqual } from 'fast-equals'
import { type PropsWithChildren, createContext, useContext, useEffect, useState } from 'react'

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
  'FitView',
  'CompareWithLatest',
  /**
   * Running in VSCode
   */
  'Vscode',
  'ElementTags',
] as const
export type FeatureName = typeof FeatureNames[number]

export type EnabledFeatures = {
  [P in `enable${FeatureName}`]: boolean
}

export const DefaultFeatures: EnabledFeatures = {
  enableReadOnly: true,
  enableCompareWithLatest: false,
  enableControls: false,
  enableDynamicViewWalkthrough: false,
  enableElementDetails: false,
  enableFocusMode: false,
  enableNavigateTo: false,
  enableNotations: false,
  enableRelationshipBrowser: false,
  enableRelationshipDetails: false,
  enableSearch: false,
  enableNavigationButtons: false,
  enableFitView: false,
  enableVscode: false,
  enableElementTags: false,
}
const DiagramFeaturesContext = createContext<EnabledFeatures>(DefaultFeatures)

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
        const next = {
          ...outerScope,
          ...features,
          ...overrides,
        }
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

const overridesForOverlays: Partial<EnabledFeatures> = {
  enableControls: false,
  enableReadOnly: true,
  enableCompareWithLatest: false,
}
DiagramFeatures.Overlays = ({ children }: PropsWithChildren) => {
  return (
    <DiagramFeatures overrides={overridesForOverlays}>
      {children}
    </DiagramFeatures>
  )
}

export function useEnabledFeatures(): EnabledFeatures {
  return useContext(DiagramFeaturesContext)
}

export type IfEnabledProps = PropsWithChildren<{
  feature: FeatureName
  /**
   * Additional AND condition
   * @default true
   * @example
   * <IfEnabled feature="ReadOnly" and={isSomething}>
   *   ...
   * </IfEnabled>
   */
  and?: boolean
}>

/**
 * Renders children only if the specified feature is enabled
 * @param feature Feature name
 * @param and Additional AND condition
 * @example
 * <IfEnabled feature="ReadOnly" and={isSomething}>
 *   ...
 * </IfEnabled>
 */
export function IfEnabled({
  feature,
  children,
  and = true,
}: PropsWithChildren<{ feature: FeatureName; and?: boolean }>) {
  const enabled = useEnabledFeatures()[`enable${feature}`] === true
  return enabled && and ? <>{children}</> : null
}

export function IfNotEnabled({ feature, children }: PropsWithChildren<{ feature: FeatureName }>) {
  const notEnabled = useEnabledFeatures()[`enable${feature}`] !== true
  return notEnabled ? <>{children}</> : null
}

export function IfReadOnly({ children }: PropsWithChildren) {
  const isReadOnly = useEnabledFeatures()[`enableReadOnly`] === true
  return isReadOnly ? <>{children}</> : null
}

export function IfNotReadOnly({ children }: PropsWithChildren) {
  const isReadOnly = useEnabledFeatures()[`enableReadOnly`] === true
  if (isReadOnly) {
    return null
  }
  return <>{children}</>
}
