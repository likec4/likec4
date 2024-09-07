import { nonNullable } from '@likec4/core'
import { Badge, Box, Button, ButtonGroup } from '@mantine/core'
import { useHotkeys } from '@mantine/hooks'
import {
  IconPlayerPlayFilled,
  IconPlayerSkipBackFilled,
  IconPlayerSkipForwardFilled,
  IconPlayerStopFilled
} from '@tabler/icons-react'
import clsx from 'clsx'
import { AnimatePresence, m } from 'framer-motion'
import { first, isNonNull, isTruthy } from 'remeda'
import { useDiagramState, useDiagramStoreApi, useXYStore } from '../hooks'
import * as css from './DynamicViewWalkthrough.css'

export function DynamicViewWalkthrough() {
  const isMobile = useXYStore(s => s.width <= 750)
  const {
    nextDynamicStep,
    stopDynamicView,
    isActive,
    isParallel,
    hasNext,
    hasPrevious
  } = useDiagramState(s => ({
    nextDynamicStep: s.nextDynamicStep,
    stopDynamicView: s.stopWalkthrough,
    isActive: isNonNull(s.activeWalkthrough),
    isParallel: isTruthy(s.activeWalkthrough?.parallelPrefix),
    hasNext: s.activeWalkthrough?.hasNext ?? false,
    hasPrevious: s.activeWalkthrough?.hasPrevious ?? false
  }))
  const diagramApi = useDiagramStoreApi()

  useHotkeys(
    isActive
      ? [
        ['ArrowLeft', () => nextDynamicStep(-1)],
        ['ArrowRight', () => nextDynamicStep()],
        ['Escape', (e) => {
          e.stopImmediatePropagation()
          stopDynamicView()
        }, { preventDefault: true }]
      ]
      : [
        ['ArrowLeft', () => nextDynamicStep()],
        ['ArrowRight', () => nextDynamicStep()]
      ]
  )

  const buttonProps = {
    className: css.btn,
    size: isMobile ? 'compact-md' : 'lg',
    radius: isMobile ? 'lg' : 'xl'
  }

  const startWalkthrough = (e: React.MouseEvent) => {
    e.stopPropagation()
    const {
      xyedges,
      activateWalkthrough
    } = diagramApi.getState()
    const firstEdge = nonNullable(first(xyedges), 'expected at least one edge')
    activateWalkthrough(firstEdge.data.edge.id)
  }

  const nextStep = (increment = 1) => (e: React.MouseEvent) => {
    e.stopPropagation()
    nextDynamicStep(increment)
  }

  return (
    <AnimatePresence>
      {isParallel && (
        <Box
          layout
          key={'parallel-frame'}
          component={m.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={clsx('react-flow__panel', css.parallelStateFrame)}
        />
      )}
      <Box
        className={clsx('react-flow__panel', css.container)}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        {!isActive
          && (
            <Button
              {...buttonProps}
              className={clsx(css.buttons, css.btn)}
              rightSection={<IconPlayerPlayFilled />}
              onClick={startWalkthrough}
              px={'xl'}>
              Start
            </Button>
          )}
        {isParallel && (
          <Badge
            key={'parallel-badge'}
            component={m.div}
            initial={{ opacity: 0.05, transform: 'translateY(20px)' }}
            animate={{ opacity: 1, transform: 'translateY(0)' }}
            exit={{
              opacity: 0,
              transform: 'translateY(20px)'
            }}
            variant="gradient"
            size={isMobile ? 'xs' : 'md'}
            gradient={{ from: 'red', to: 'orange', deg: 90 }}
            radius={'sm'}>
            parallel
          </Badge>
        )}
        {isActive && (
          <ButtonGroup className={css.buttons}>
            <Button
              {...buttonProps}
              pl={'lg'}
              disabled={!hasPrevious}
              onClick={nextStep(-1)}>
              <IconPlayerSkipBackFilled />
            </Button>

            <Button
              {...buttonProps}
              px={hasNext ? 'md' : 'xl'}
              onClick={e => {
                e.stopPropagation()
                stopDynamicView()
              }}>
              {hasNext && <IconPlayerStopFilled />}
              {!hasNext && 'End'}
            </Button>
            {hasNext && (
              <Button
                {...buttonProps}
                pr={'lg'}
                onClick={nextStep()}>
                <IconPlayerSkipForwardFilled />
              </Button>
            )}
          </ButtonGroup>
        )}
      </Box>
    </AnimatePresence>
  )
}
