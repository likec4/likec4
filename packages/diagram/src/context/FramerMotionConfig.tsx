import { useMantineStyleNonce } from '@mantine/core'
import { domMax, LazyMotion, MotionConfig } from 'motion/react'
import type { PropsWithChildren } from 'react'

export const FramerMotionConfig = ({
  reducedMotion = 'user',
  children,
}: PropsWithChildren<{
  /**
   * If true, will respect the device prefersReducedMotion setting by switching
   * transform animations off.
   */
  reducedMotion?: 'always' | 'never' | 'user' | undefined
}>) => {
  const nonce = useMantineStyleNonce()?.()
  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion={reducedMotion} {...nonce && { nonce }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  )
}
