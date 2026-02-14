import type { ExclusiveUnion } from '@likec4/core/types';
import { type PropsWithChildren } from 'react';
import type { JSX } from 'react/jsx-runtime';
declare const FeatureNames: readonly ["Controls", "Editor", "ReadOnly", "FocusMode", "NavigateTo", "ElementDetails", "RelationshipDetails", "RelationshipBrowser", "Search", "NavigationButtons", "Notations", "DynamicViewWalkthrough", "FitView", "CompareWithLatest", "Notes", "Vscode", "ElementTags"];
export type FeatureName = typeof FeatureNames[number];
export type TogglableFeature = ('ReadOnly' | 'CompareWithLatest') & FeatureName;
export type EnabledFeatures = {
    [P in `enable${FeatureName}`]: boolean;
};
export declare const DefaultFeatures: EnabledFeatures;
export declare function DiagramFeatures({ children, features, overrides, }: PropsWithChildren<ExclusiveUnion<{
    features: {
        features: EnabledFeatures;
    };
    overrides: {
        overrides: Partial<EnabledFeatures>;
    };
}>>): JSX.Element;
export declare namespace DiagramFeatures {
    var Overlays: ({ children }: PropsWithChildren) => import("react").JSX.Element;
}
export declare function useEnabledFeatures(): EnabledFeatures;
export type IfEnabledProps = PropsWithChildren<{
    feature: FeatureName;
    /**
     * Additional AND condition
     * @default true
     * @example
     * <IfEnabled feature="ReadOnly" and={isSomething}>
     *   ...
     * </IfEnabled>
     */
    and?: boolean;
}>;
/**
 * Renders children only if the specified feature is enabled
 * @param feature Feature name
 * @param and Additional AND condition
 * @example
 * <IfEnabled feature="ReadOnly" and={isSomething}>
 *   ...
 * </IfEnabled>
 */
export declare function IfEnabled({ feature, children, and, }: PropsWithChildren<{
    feature: FeatureName;
    and?: boolean;
}>): JSX.Element | null;
export declare function IfNotEnabled({ feature, children }: PropsWithChildren<{
    feature: FeatureName;
}>): JSX.Element | null;
export declare function IfReadOnly({ children }: PropsWithChildren): JSX.Element | null;
export declare function IfNotReadOnly({ children }: PropsWithChildren): JSX.Element | null;
export {};
