
import { type JSX, type PropsWithChildren } from 'react'
import { CustomizationContext } from './customizable'
import { WrappedMarker, type CustomComponents, type Customizables, type Wrapper } from './customization-types'

// export const CustomizationContext = createContext<CustomizationProps | null>(null);
// CustomizationContext.displayName = 'CustomizationContext'

export interface CustomizationProps {
  /**
   * Slot overrides from {@link customizeComponents}.
   * Prefer a module-scoped constant so the map identity stays stable across HMR.
   */
  components?: CustomComponents | undefined
}


/**
 * Marks a component as a wrap override. The registered shell injects `Original`
 * (the built-in implementation) into the props.
 *
 * @experimental
 */
function wrapOriginal<P>(
  wrapper: Wrapper<P>,
): (props: P) => any {
  return Object.assign(wrapper, { [WrappedMarker]: true as const }) as any
}

/**
 * Defines overrides for registered customizable slots.
 * To be used with {@link createCustomization}.
 * 
 * Overrides support two modes:
 * - **replace** — pass a component that receives the original props
 * - **wrap** — use `wrap` function; receives `{ Original, ...props }`
 
 * @example
 * ```tsx
 * import { customizeComponents } from 'likec4/react'
 * 
 * const components = customizeComponents(({ wrap }) => ({
 *   Logo: () => <span>My logo</span>, // replace
 *   LikeC4Diagram: wrap(({ Original, ...props }) => (
 *     <Original {...props} onClick={() => console.log('logo')} />
 *   )),
 * }))
 * ```
 *
 * @experimental
 */
export function customizeComponents(
  value: Partial<Customizables> | ((ctx: { wrap: typeof wrapOriginal }) => Partial<Customizables>),
): CustomComponents {
  return typeof value === 'function' ? value({ wrap: wrapOriginal }) : value
}


/**
 * Creates a customization context provider that can be used to override or
 * extend the default UI components used by LikeC4.
 *
 * Place this above the diagram tree (`LikeC4Diagram` / `ReactLikeC4` / `LikeC4View`).
 * Ordering relative to `LikeC4ModelProvider` does not matter.
 *
 * @example
 * ```tsx
 * import { createCustomization, customizeComponents, LikeC4ModelProvider } from 'likec4/react'
 *
 * const Customization = createCustomization({
 *   components: customizeComponents(({ wrap }) => ({
 *     Logo: () => <span>Brand</span>,
 *     LikeC4Diagram: wrap(({ Original, ...props }) => (
 *       <Original {...props} pannable={false} />
 *     )),
 *   })),
 * })
 *
 * function App() {
 *   return (
 *     <Customization>
 *       <LikeC4ModelProvider likec4model={model}>
 *         <LikeC4View viewId="index" />
 *       </LikeC4ModelProvider>
 *     </Customization>
 *   )
 * }
 * ```
 * @experimental
 */
export function createCustomization(value: CustomizationProps): CustomizationProvider {  
  // Named function is required for HMR
  let customizationValue = {
    components: value.components
  }
  // const Cmp = function CustomizationProvider1({children}: PropsWithChildren) {
  //   return <CustomizationContext.Provider value={customizationValue}>
  //     {children}
  //   </CustomizationContext.Provider>
  // }
  // Cmp.displayName = 'CustomizationProvider1'
  return ({children}) => <CustomizationContext.Provider value={customizationValue}>
    {children}
  </CustomizationContext.Provider>
}
export type CustomizationProvider = (props: PropsWithChildren) => JSX.Element
