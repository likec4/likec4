import type { ExclusiveUnion } from '@likec4/core/types'
import { shallowEqual } from 'fast-equals'
import { type PropsWithChildren, createContext, useContext, useEffect, useState } from 'react'
import { mapToObj } from 'remeda'

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
  'FitView',
  /**
   * Running in VSCode
   */
  'Vscode',
  'ElementTags',
] as const
export type FeatureName = typeof FeatureNames[number]

type CustomFeatures = {
  enableControls: 'next' | boolean
}

export type EnabledFeatures = {
  [P in `enable${FeatureName}`]: P extends keyof CustomFeatures ? CustomFeatures[P] : boolean
}

export const AllDisabled: EnabledFeatures = mapToObj(
  FeatureNames,
  (name) => [`enable${name}`, false] as const,
)
const DiagramFeaturesContext = createContext<EnabledFeatures>(AllDisabled)

const validate = (features: EnabledFeatures) => {
  let {
    enableReadOnly,
    enableEdgeEditing,
    ...rest
  } = features

  if (enableReadOnly) {
    enableEdgeEditing = false
  }

  return {
    enableReadOnly,
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

export function useEnabledFeatures(): EnabledFeatures {
  return useContext(DiagramFeaturesContext)
}

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
