import { ActionIcon, Box, Button, rem, useComputedColorScheme } from '@mantine/core'
import {
  IconHeart,
  IconPhoto,
  IconPlayerPlayFilled,
  IconPlayerSkipBackFilled,
  IconPlayerSkipForwardFilled,
  IconPlayerStopFilled,
  IconSettings
} from '@tabler/icons-react'
import clsx from 'clsx'
import { isNullish, isNumber } from 'remeda'
import { useDiagramState } from '../state/useDiagramStore'
import * as css from './DynamicViewWalkthrough.css'

export function DynamicViewWalkthrough() {
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

  const buttonProps = {
    className: css.btn,
    size: 'compact-xl',
    radius: 'xl'
  }

  const nextStep = (increment = 1) => (e: React.MouseEvent) => {
    e.stopPropagation()
    nextDynamicStep(increment)
  }

  return (
    <Box
      className={clsx('react-flow__panel', css.container)}
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
        <Button.Group className={css.buttons}>
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
        </Button.Group>
      )}
    </Box>
  )
}
