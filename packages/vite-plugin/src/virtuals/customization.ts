import type { VirtualModule } from './_shared'
import { logGenerating } from '../logger'
import { hardenJsonStringLiteralForEmbeddedScript } from './hardenJsonStringLiteralForEmbeddedScript'

/**
 * createCustomization returns the CustomizationProvider
 */
export const generateCustomizationCode = (customizationFile: string | undefined): string => {
  if (!customizationFile) {
    return `export { Fragment as CustomizationProvider } from "react";`
  }
  const fileLiteral = hardenJsonStringLiteralForEmbeddedScript(JSON.stringify(customizationFile))
  // Here we create a HMR boundary for the customization file
  // We don't wrap in jsx (consumer of 'likec4:customization' does it) -`default` from customization file acts as a bridge
  // So we get <CustomizationProvider> => Customization(props) => <CustomizationContext.Provider .../>
  // !important: we still need to import jsx from react/jsx-runtime for HMR
  return `
  import { jsx } from 'react/jsx-runtime';
  import { Fragment } from 'react';
  import { default as Customization } from ${fileLiteral};
  export function CustomizationProvider(props) {
    return jsx(Fragment, { children: Customization(props) });
  }
  `
}

export const customizationModule: VirtualModule = {
  name: 'customization',
  async load({ customizationFile }) {
    logGenerating('customization')
    return {
      code: generateCustomizationCode(customizationFile),
      moduleType: 'js',
      moduleSideEffects: false,
    }
  },
}
