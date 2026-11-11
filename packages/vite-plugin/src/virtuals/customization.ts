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
import { atom, useStore } from 'likec4/vite-plugin/internal'

export let $customComponents = atom(undefined)

export function useCustomComponents() {
  return useStore($customComponents)
}
`
  }
  const fileLiteral = hardenJsonStringLiteralForEmbeddedScript(JSON.stringify(customizationFile))
  return `
import { atom, useStore } from 'likec4/vite-plugin/internal'
import components from ${fileLiteral}

export let $customComponents = atom(components)

export function useCustomComponents() {
  return useStore($customComponents)
}

if (import.meta.hot) {
  import.meta.hot.accept(md => {
    if (!import.meta.hot.data.$update) {
      import.meta.hot.data.$update = $customComponents
    }
    const update = md?.$customComponents
    if (update) {
      import.meta.hot.data.$update.set(update.get())
    } else {
      import.meta.hot.invalidate()
    }
  })
}
`
}

export const customizationModule: VirtualModule = {
  id: 'likec4:customization',
  virtualId: 'likec4:plugin/customization.js',
  async load({ customizationFile }) {
    logGenerating('customization')
    return {
      code: generateCustomizationCode(customizationFile),
      moduleType: 'js',
    }
  },
}
