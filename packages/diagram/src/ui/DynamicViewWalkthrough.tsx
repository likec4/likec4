import { Box, Button, ButtonGroup } from '@mantine/core'
import { useHotkeys } from '@mantine/hooks'
import {
  IconPlayerPlayFilled,
  IconPlayerSkipBackFilled,
  IconPlayerSkipForwardFilled,
  IconPlayerStopFilled
} from '@tabler/icons-react'
import clsx from 'clsx'
import { isNullish, isNumber } from 'remeda'
import { useDiagramState } from '../state/hooks'
import { useXYStore } from '../xyflow/hooks/useXYFlow'
import * as css from './DynamicViewWalkthrough.css'

export function DynamicViewWalkthrough() {
  const isMobile = useXYStore(s => s.width <= 750)
  const {
    nextDynamicStep,
    stopDynamicView,
    activeDynamicViewStep,
    hasNextSteps
  } = useDiagramState(s => ({
    nextDynamicStep: s.nextDynamicStep,
    stopDynamicView: s.stopDynamicView,
    activeDynamicViewStep: s.activeDynamicViewStep,
    hasNextSteps: (s.activeDynamicViewStep ?? 1) < s.view.edges.length
  }))

  const isActive = isNumber(activeDynamicViewStep)

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

  const nextStep = (increment = 1) => (e: React.MouseEvent) => {
    e.stopPropagation()
    nextDynamicStep(increment)
  }

  return (
    <Box
      className={clsx('react-flow__panel', css.container)}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      {isNullish(activeDynamicViewStep)
        && (
          <Button
            {...buttonProps}
            className={clsx(css.buttons, css.btn)}
            rightSection={<IconPlayerPlayFilled />}
            onClick={nextStep()}
            px={'xl'}>
            Start
          </Button>
        )}
      {isNumber(activeDynamicViewStep) && (
        <ButtonGroup className={css.buttons}>
          <Button
            {...buttonProps}
            pl={'lg'}
            disabled={activeDynamicViewStep === 1}
            onClick={nextStep(-1)}>
            <IconPlayerSkipBackFilled />
          </Button>

          <Button
            {...buttonProps}
            px={hasNextSteps ? 'md' : 'xl'}
            onClick={e => {
              e.stopPropagation()
              stopDynamicView()
            }}>
            {hasNextSteps && <IconPlayerStopFilled />}
            {!hasNextSteps && 'End'}
          </Button>
          {hasNextSteps && (
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
  )
}
