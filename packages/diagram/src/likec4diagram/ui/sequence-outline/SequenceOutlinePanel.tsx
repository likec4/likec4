import { vstack } from '@likec4/styles/patterns'
import { AnimatePresence, LayoutGroup, m, MotionConfig } from 'motion/react'
import { memo } from 'react'
import { PortalToContainer } from '../../../components/PortalToContainer'
import { FramerMotionConfig } from '../../../context'
import { SEQ_TRANSITION } from './motion'
import { OutlineBody } from './OutlineBody'
import { OutlineHeader } from './OutlineHeader'
import { StoreProvider, useOutlinePanelWidth } from './StoreProvider'

/**
 * Side panel shown while a dynamic view walkthrough is running: the view title and progress,
 * the trail of fragments the current step sits in, and the outline of every step.
 */
export const SequenceOutlinePanel = memo(() => {
  return (
    <StoreProvider>
      <PortalToContainer>
        <MotionConfig transition={SEQ_TRANSITION}>
          <LayoutGroup>
            <AnimatePresence propagate mode="popLayout" anchorY="top">
              <SequenceOutlinePanelShell>
                <OutlineHeader />
                <OutlineBody />
              </SequenceOutlinePanelShell>
            </AnimatePresence>
          </LayoutGroup>
        </MotionConfig>
      </PortalToContainer>
    </StoreProvider>
  )
})
SequenceOutlinePanel.displayName = 'SequenceOutlinePanel'

const SequenceOutlinePanelShell = ({ children }: { children: React.ReactNode }) => {
  const outlinePanelWidth = useOutlinePanelWidth()
  return (
    <m.div
      layout="position"
      className={vstack({
        position: 'absolute',
        top: '0',
        left: '0',
        layerStyle: 'likec4.panel',
        rounded: '0',
        gap: '0',
        padding: '0',
        pointerEvents: 'all',
        maxWidth: '[85cqw]',
        height: '100cqh',
        maxHeight: '100cqh',
        cursor: 'default',
        overflow: 'hidden',
      })}
      style={{
        width: outlinePanelWidth,
      }}
      initial={{ opacity: 0.5, translateX: -40 }}
      animate={{ opacity: 1, translateX: 0 }}
      exit={{ opacity: 0, translateX: -40 }}
    >
      {children}
    </m.div>
  )
}
