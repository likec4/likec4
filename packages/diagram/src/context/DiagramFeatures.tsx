// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type { ExclusiveUnion } from '@likec4/core/types'
import { type PropsWithChildren, createContext, useContext, useEffect } from 'react'
import type { JSX } from 'react/jsx-runtime'
import { useSetState } from '../hooks/useSetState'
import { useUpdateEffect } from '../hooks/useUpdateEffect'

const FeatureNames = [
  'Controls',
  'Editor',
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
  'Notes',
  /**
   * Running in VSCode
   */
  'Vscode',
  'ElementTags',
  'AIChat',
] as const
export type FeatureName = typeof FeatureNames[number]

// Features that can be toggled on/off at runtime in diagram context
export type TogglableFeature =
  & (
    | 'ReadOnly'
    | 'CompareWithLatest'
  )
  & FeatureName

export type EnabledFeatures = {
  [P in `enable${FeatureName}`]: boolean
}

export const DefaultFeatures: EnabledFeatures = {
  enableEditor: false,
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
  enableNotes: false,
  enableAIChat: false,
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
>): JSX.Element {
  const outerScope = useContext(DiagramFeaturesContext)
  const [scope, setScope] = useSetState(() => ({
    ...outerScope,
    ...features,
    ...overrides,
  }))

  useUpdateEffect(
    () => {
      setScope({
        ...outerScope,
        ...features,
        ...overrides,
      })
    },
    [outerScope, features, overrides, setScope],
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
}: PropsWithChildren<{ feature: FeatureName; and?: boolean }>): JSX.Element | null {
  const enabled = useEnabledFeatures()[`enable${feature}`] === true
  return enabled && and ? <>{children}</> : null
}

export function IfNotEnabled({ feature, children }: PropsWithChildren<{ feature: FeatureName }>): JSX.Element | null {
  const notEnabled = useEnabledFeatures()[`enable${feature}`] !== true
  return notEnabled ? <>{children}</> : null
}

export function IfReadOnly({ children }: PropsWithChildren): JSX.Element | null {
  const isReadOnly = useEnabledFeatures().enableReadOnly === true
  return isReadOnly ? <>{children}</> : null
}

export function IfNotReadOnly({ children }: PropsWithChildren): JSX.Element | null {
  const isReadOnly = useEnabledFeatures().enableReadOnly === true
  if (isReadOnly) {
    return null
  }
  return <>{children}</>
}
