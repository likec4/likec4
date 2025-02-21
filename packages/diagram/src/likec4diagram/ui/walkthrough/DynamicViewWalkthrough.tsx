import { Badge, Box, Button, ButtonGroup } from '@mantine/core'
import {
  IconPlayerPlayFilled,
  IconPlayerSkipBackFilled,
  IconPlayerSkipForwardFilled,
  IconPlayerStopFilled,
} from '@tabler/icons-react'
import clsx from 'clsx'
import { AnimatePresence, m } from 'framer-motion'
import { isNonNull, isTruthy } from 'remeda'
import { useXYStore } from '../../../hooks'
import { useDiagram, useDiagramContext } from '../../../hooks/useDiagram'
import * as css from './DynamicViewWalkthrough.css'

export function DynamicViewWalkthrough() {
  const isMobile = useXYStore(s => s.width <= 750)
  const {
    isActive,
    isParallel,
    hasNext,
    hasPrevious,
  } = useDiagramContext(s => ({
    isActive: isNonNull(s.activeWalkthrough),
    isParallel: isTruthy(s.activeWalkthrough?.parallelPrefix),
    hasNext: s.xyedges.findIndex(e => e.id === s.activeWalkthrough?.stepId) < s.xyedges.length - 1,
    hasPrevious: s.xyedges.findIndex(e => e.id === s.activeWalkthrough?.stepId) > 0,
  }))
  const diagram = useDiagram()

  const buttonProps = {
    className: css.btn,
    size: isMobile ? 'compact-md' : 'lg',
    radius: isMobile ? 'lg' : 'xl',
  }

  // const startWalkthrough = (e: React.MouseEvent) => {
  //   e.stopPropagation()
  //   const {
  //     xyedges,
  //     activateWalkthrough
  //   } = diagramApi.getState()
  //   const firstEdge = nonNullable(first(xyedges), 'expected at least one edge')
  //   activateWalkthrough(firstEdge.data.edge.id)
  // }

  // const nextStep = (increment = 1) => (e: React.MouseEvent) => {
  //   e.stopPropagation()
  //   nextDynamicStep(increment)
  // }

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
              onClick={() => diagram.startWalkthrough()}
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
              transform: 'translateY(20px)',
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
              onClick={() => diagram.walkthroughStep('previous')}>
              <IconPlayerSkipBackFilled />
            </Button>

            <Button
              {...buttonProps}
              px={hasNext ? 'md' : 'xl'}
              onClick={e => {
                e.stopPropagation()
                diagram.stopWalkthrough()
              }}>
              {hasNext && <IconPlayerStopFilled />}
              {!hasNext && 'End'}
            </Button>
            {hasNext && (
              <Button
                {...buttonProps}
                pr={'lg'}
                onClick={() => diagram.walkthroughStep('next')}>
                <IconPlayerSkipForwardFilled />
              </Button>
            )}
          </ButtonGroup>
        )}
      </Box>
    </AnimatePresence>
  )
}
