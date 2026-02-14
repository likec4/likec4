import { css } from '@likec4/styles/css'
import { HStack } from '@likec4/styles/jsx'
import { hstack, vstack } from '@likec4/styles/patterns'
import { Button, Divider } from '@mantine/core'
import { useIsMounted } from '@react-hookz/web'
import { type Variants, AnimatePresence } from 'motion/react'
import * as m from 'motion/react-m'
import { memo, useState } from 'react'
import { useEnabledFeatures } from '../../context'
import { useCallbackRef, useMantinePortalProps } from '../../hooks'
import { useDiagramCompareLayout } from '../../hooks/useDiagramCompareLayout'
import { Tooltip } from '../_common'
import { ComparePanelControls } from './ComparePanelControls'
import { DriftsSummary } from './DriftsSummary'

const variants = {
  initial: {
    opacity: 0,
    translateX: -20,
  },
  animate: {
    opacity: 1,
    translateX: 0,
  },
  exit: {
    opacity: 0,
    translateX: -20,
  },
} satisfies Variants

export const ComparePanel = memo(() => {
  const portalProps = useMantinePortalProps()
  const isMounted = useIsMounted()
  const { enableCompareWithLatest } = useEnabledFeatures()
  const [ctx, ops] = useDiagramCompareLayout()

  const [isProcessing, setIsProcessing] = useState(false)

  const resetProcessing = () => {
    // Defer setting setIsProcessing to false to allow for animation to play out
    // before the panel potentially unmounts due to no more drifts being present
    setTimeout(() => {
      if (isMounted()) {
        setIsProcessing(false)
      }
    }, 500)
  }

  const onApplyLatest = useCallbackRef((e: React.MouseEvent) => {
    if (!ctx.canApplyLatest || ctx.layout === 'auto') {
      window.alert(
        'Cannot apply changes from latest version when using auto layout. Please switch to manual layout first.',
      )
      return
    }
    e.stopPropagation()
    setIsProcessing(true)
    setTimeout(() => {
      ops.applyLatestToManual()
      resetProcessing()
    }, 200)
  })

  const onResetManualLayout = useCallbackRef((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsProcessing(true)
    setTimeout(() => {
      ops.resetManualLayout()
      resetProcessing()
    }, 200)
  })

  return (
    <AnimatePresence>
      {enableCompareWithLatest && (
        <>
          <m.div
            key={'ComparePanel'}
            layout="size"
            layoutDependency={ctx.drifts || ctx.layout}
            className={hstack({
              gap: '2',
              layerStyle: 'likec4.panel',
              position: 'relative',
              px: '2',
              py: '1',
              pl: '3',
              pointerEvents: 'all',
            })}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <ComparePanelControls />
          </m.div>
          <m.div
            key={'ListOfDrifts'}
            layout="size"
            layoutDependency={ctx.drifts || ctx.layout}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={vstack({
              gap: '4',
              layerStyle: 'likec4.panel',
              position: 'relative',
              p: '4',
              pointerEvents: 'all',
              height: 'auto',
              overflow: 'hidden',
              maxHeight: 'calc(100cqh - 180px)',
              '@/md': {
                minWidth: '200px',
              },
            })}
          >
            <DriftsSummary />
            {ctx.canApplyLatest && (
              <>
                <m.div layout="position" className={css({ flex: '0' })}>
                  <Divider orientation="horizontal" size={'xs'} mb={'xs'} />
                  <HStack>
                    <Tooltip
                      openDelay={100}
                      disabled={ctx.layout !== 'auto'}
                      label="Switch to manual layout to apply changes."
                      {...portalProps}
                    >
                      <Button
                        loading={isProcessing}
                        size="xs"
                        color="orange"
                        variant="light"
                        onClick={onApplyLatest}
                        disabled={ctx.layout === 'auto'}>
                        Apply changes
                      </Button>
                    </Tooltip>
                    {!isProcessing && (
                      <Tooltip
                        openDelay={100}
                        disabled={ctx.layout !== 'manual'}
                        label="Reset manual layout"
                        {...portalProps}
                      >
                        <Button
                          hidden={isProcessing}
                          size="xs"
                          color="orange"
                          variant="subtle"
                          onClick={onResetManualLayout}>
                          Reset
                        </Button>
                      </Tooltip>
                    )}
                  </HStack>
                </m.div>
              </>
            )}
          </m.div>
        </>
      )}
    </AnimatePresence>
  )
})
ComparePanel.displayName = 'ComparePanel'
