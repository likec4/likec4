import { css } from '@likec4/styles/css'
import { hstack, vstack } from '@likec4/styles/patterns'
import { Button, Divider } from '@mantine/core'
import { useIsMounted } from '@react-hookz/web'
import { type Variants, AnimatePresence } from 'motion/react'
import * as m from 'motion/react-m'
import { memo, useState } from 'react'
import { useEnabledFeatures } from '../../context'
import { useCallbackRef } from '../../hooks'
import { useDiagramCompareLayout } from '../../hooks/useDiagramCompareLayout'
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
  const isMounted = useIsMounted()
  const { enableCompareWithLatest } = useEnabledFeatures()
  const [ctx, ops] = useDiagramCompareLayout()

  const [isApplyingLatest, setIsApplyingLatest] = useState(false)

  const onApplyLatest = useCallbackRef((e: React.MouseEvent) => {
    if (!ctx.canApplyLatest || ctx.layout === 'auto') {
      window.alert(
        'Cannot apply changes from latest version when using auto layout. Please switch to manual layout first.',
      )
      return
    }
    e.stopPropagation()
    setIsApplyingLatest(true)
    setTimeout(() => {
      ops.applyLatestToManual()
    }, 150)
    // Defer setting isApplyingLatest to false to allow for animation to play out
    // before the panel potentially unmounts due to no more drifts being present
    setTimeout(() => {
      if (isMounted()) {
        setIsApplyingLatest(false)
      }
    }, 500)
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
                  <Button
                    loading={isApplyingLatest}
                    size="xs"
                    color="orange"
                    variant="light"
                    onClick={onApplyLatest}
                    disabled={ctx.layout === 'auto'}>
                    Apply changes
                  </Button>
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
