import type { FC } from 'react'
import type { JSX } from 'react/jsx-runtime'
import type { ElementShape } from '../base-primitives/element/ElementShape'
import type { Logo, LogoIcon } from '../components/Logo'
import type { LikeC4Diagram } from '../LikeC4Diagram'
import type { LikeC4View } from '../LikeC4View'
import type { ReactLikeC4 } from '../ReactLikeC4'

type RegisteredCustomizables =
  | typeof LikeC4Diagram
  | typeof LikeC4View
  | typeof ReactLikeC4
  | typeof Logo
  | typeof LogoIcon
  | typeof ElementShape

export type Customizable<TComponent extends FC<any>, Name extends string> = TComponent & {
  readonly displayName: Name
}

export type CustomizableName = RegisteredCustomizables['displayName']

export type Customizables = {
  [K in CustomizableName]: Extract<RegisteredCustomizables, { displayName: K }> extends Customizable<infer Component, K>
    ? Component
    : never
}

export type PropsOf<FC> = FC extends (props: infer P) => any ? P : never

export type Wrapper<P> = (props: P & { Original: FC<P> }) => JSX.Element

/**
 * Marker copied onto wrap overrides so the registered shell can inject `Original`.
 * @internal
 */
export const WrappedMarker = Symbol.for('likec4.customizable.wrapped')

/**
 * A replacement or wrap override for a registered slot.
 */
export type CustomComponent<Original extends FC<any>> =
  | Original & {
    [WrappedMarker]?: never
  }
  | Wrapper<PropsOf<Original>> & {
    [WrappedMarker]: true
  }

/**
 * Partial map of slot overrides for {@link CustomizationProvider}.
 *
 * @experimental
 */
export type CustomComponents = {
  [K in CustomizableName]?: CustomComponent<Customizables[K]>
}
