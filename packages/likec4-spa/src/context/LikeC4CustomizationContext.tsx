import { CustomizationProvider } from '@likec4/diagram/custom'
import { useCustomComponents } from 'likec4:customization'
import type { PropsWithChildren } from 'react'

/**
 * Applies UI overrides from the customization file configured in the LikeC4 Vite plugin
 */
export function LikeC4CustomizationContext({ children }: PropsWithChildren) {
  const components = useCustomComponents()
  return (
    <CustomizationProvider components={components}>
      {children}
    </CustomizationProvider>
  )
}
