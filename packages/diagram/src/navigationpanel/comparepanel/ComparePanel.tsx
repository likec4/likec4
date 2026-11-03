import { Box, Txt } from '@likec4/styles/jsx'
import { hstack, vstack } from '@likec4/styles/patterns'
import { ActionBar, Button, CloseButton } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useIsMounted } from '@react-hookz/web'
import { IconInfoCircle } from '@tabler/icons-react'
import { type Variants, AnimatePresence } from 'motion/react'
import * as m from 'motion/react-m'
import { memo, useState } from 'react'
import { PortalToContainer } from '../../custom'
import { useCallbackRef, useMantinePortalProps } from '../../hooks'
import { useDiagramCompareLayout } from '../../hooks/useDiagramCompareLayout'
import { stopPropagation } from '../../utils'
import { Tooltip } from '../_common'
import { DriftsSummary } from './DriftsSummary'
import { LayoutDriftFrame } from './LayoutDriftFrame'
import { LayoutTypeSwitcher } from './LayoutTypeSwitcher'

const easeOut = [0.23, 1, 0.32, 1] as const

const variants = {
  initial: {
    opacity: 0,
    transform: 'translateX(-8px)',
  },
  animate: {
    opacity: 1,
    transform: 'translateX(0px)',
    transition: { duration: 0.2, ease: easeOut },
  },
  exit: {
    opacity: 0,
    transform: 'translateX(-4px)',
    transition: { duration: 0.15, ease: easeOut },
  },
} satisfies Variants

export const ComparePanel = memo(() => {
  const [driftsOpened, driftsPanel] = useDisclosure(true)
  const portalProps = useMantinePortalProps()
  const [ctx, ops] = useDiagramCompareLayout()
  const isMounted = useIsMounted()
  const [isProcessing, setIsProcessing] = useState<'sync' | 'reset' | false>(false)

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
    setIsProcessing('sync')
    setTimeout(() => {
      ops.applyLatestToManual()
      resetProcessing()
    }, 100)
  })

  const onResetManualLayout = useCallbackRef((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsProcessing('reset')
    setTimeout(() => {
      ops.resetManualLayout()
      resetProcessing()
    }, 100)
  })

  return (
    <>
      <PortalToContainer>
        <ActionBar
          opened
          withinPortal={false}
          onClose={ops.toggleCompare}>
          <Button
            variant="default"
            size="compact-xs"
            onClick={() => {
              driftsPanel.toggle()
            }}>
            {driftsOpened ? 'Hide' : 'Show'} drifts
          </Button>
          <ActionBar.Divider />
          <LayoutTypeSwitcher
            value={ctx.layout}
            onChange={ops.switchLayout} />
          <ActionBar.Divider />
          <Button
            loading={isProcessing === 'sync'}
            disabled={!ctx.canApplyLatest || ctx.layout === 'auto' || isProcessing === 'reset'}
            onClick={onApplyLatest}
            size="compact-xs"
            rightSection={
              <Tooltip
                onClick={stopPropagation}
                position="right-start"
                {...portalProps}
                label={
                  <>
                    Applies changes from the latest auto-layouted<br />
                    to saved snapshot, preserving (as possible)<br />
                    manual adjustments.<br />
                    <br />
                    You can undo this action.
                  </>
                }
              >
                <IconInfoCircle size={14} stroke={1.7} opacity={0.5} />
              </Tooltip>
            }
          >
            Sync with latest
            {!ctx.canApplyLatest && <Box textStyle={'xs'}>view type is changed</Box>}
          </Button>
          <Button
            loading={isProcessing === 'reset'}
            disabled={isProcessing === 'sync'}
            variant="default"
            size="compact-xs"
            onClick={onResetManualLayout}>
            Reset manual
          </Button>
          <ActionBar.CloseButton />
        </ActionBar>
        <LayoutDriftFrame
          layout={ctx.layout}
          onClose={ops.toggleCompare} />
      </PortalToContainer>
      <AnimatePresence mode="popLayout" anchorY="top">
        {driftsOpened && (
          <m.div
            key={'ListOfDrifts'}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={vstack({
              layerStyle: 'likec4.panel',
              position: 'relative',
              px: '0',
              py: '0',
              pointerEvents: 'all',
              height: 'auto',
              overflow: 'hidden',
              maxHeight: '[calc(100cqh - 180px)]',
              '@/md': {
                minWidth: '[200px]',
              },
              maxWidth: {
                base: '[200px]',
                '@/sm': '[250px]',
                '@/md': '[300px]',
              },
            })}
          >
            <div
              className={hstack({
                gap: '2',
                pl: '3',
                pr: '2',
                mt: '2',
              })}>
              <Txt medium size={'sm'} flex="1">
                Layout drifts
              </Txt>
              <Button
                variant="default"
                size="compact-xs"
                fz="xxs"
                style={{
                  flex: 0,
                  // Ensure button has minimum width to prevent layout shifts
                  minWidth: 100,
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  ops.switchLayout(ctx.layout === 'auto' ? 'manual' : 'auto')
                }}>
                Switch to {ctx.layout === 'auto' ? 'manual' : 'latest'}
              </Button>
              <CloseButton
                size="xs"
                onClick={(e) => {
                  e.stopPropagation()
                  driftsPanel.close()
                }} />
            </div>
            <DriftsSummary />
          </m.div>
        )}
      </AnimatePresence>
    </>
  )
})
ComparePanel.displayName = 'ComparePanel'
