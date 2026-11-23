import { logGenerating } from '../logger'
import type { VirtualModule } from './_shared'
import { hardenJsonStringLiteralForEmbeddedScript } from './hardenJsonStringLiteralForEmbeddedScript'

/**
 * The atom keeps its identity across HMR updates of the customization file,
 * so consumers re-render with the new overrides instead of reloading the page.
 */
export const generateCustomizationCode = (customizationFile: string | undefined): string => {
  if (!customizationFile) {
    return `
import { atom } from 'likec4/vite-plugin/internal';

export { Fragment as CustomizationContext } from "react";

export const ComponentsAtom = atom({})
`
  }
  const fileLiteral = hardenJsonStringLiteralForEmbeddedScript(JSON.stringify(customizationFile))
  return `
import { jsx } from "react/jsx-runtime";
import { CustomizationProvider } from 'likec4/react';
import { atom, useStore } from 'likec4/vite-plugin/internal';
import components from ${fileLiteral}

export let ComponentsAtom = atom({...components})

export function CustomizationContext(props) {
  const components = useStore(ComponentsAtom)
  return jsx(CustomizationProvider, { ...props, components })
}

if (import.meta.hot) {
  import.meta.hot.accept((md) => {
    if (!import.meta.hot.data.$update) {
      import.meta.hot.data.$update = (update) => {
        ComponentsAtom.set(update)
      }
    }
    if (md) {
      import.meta.hot.data.$update(md.ComponentsAtom.get())
    } else {
      import.meta.hot.invalidate()
    }
  })
}
`
}

export const customizationModule: VirtualModule = {
  id: 'likec4:customization',
  virtualId: 'likec4:plugin/customization',
  async load({ customizationFile }) {
    logGenerating('customization')
    return {
      code: generateCustomizationCode(customizationFile),
      moduleType: 'js',
      moduleSideEffects: false,
    }
  },
}
