import { useMantineStyleNonce } from '@mantine/core'
import { domMax, LazyMotion, MotionConfig } from 'framer-motion'
import { type PropsWithChildren } from 'react'

export const FramerMotionConfig = ({
  reducedMotion = 'user',
  children,
}: PropsWithChildren<{
  /**
   * If true, will respect the device prefersReducedMotion setting by switching
   * transform animations off.
   *
   * @public
   */
  reducedMotion?: 'always' | 'never' | 'user'
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
