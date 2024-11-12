import { useMantineStyleNonce } from '@mantine/core'
import { useId } from '@mantine/hooks'
import { domMax, LayoutGroup, LazyMotion, MotionConfig } from 'framer-motion'
import { type PropsWithChildren } from 'react'

export const FramerMotionConfig = ({ children }: PropsWithChildren) => {
  const layoutId = useId()
  const nonce = useMantineStyleNonce()?.()
  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user" {...nonce && { nonce }}>
        <LayoutGroup id={layoutId}>
          {children}
        </LayoutGroup>
      </MotionConfig>
    </LazyMotion>
  )
}
