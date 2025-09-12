import { css } from '@likec4/styles/css'
import { Box } from '@likec4/styles/jsx'
import { Badge, Button, Portal } from '@mantine/core'
import {
  IconPlayerSkipBackFilled,
  IconPlayerSkipForwardFilled,
  IconPlayerStopFilled,
} from '@tabler/icons-react'
import { AnimatePresence } from 'motion/react'
import * as m from 'motion/react-m'
import { isTruthy } from 'remeda'
import { useMantinePortalProps } from '../../hooks'
import { useDiagram, useDiagramContext } from '../../hooks/useDiagram'
import { TriggerWalkthroughButton } from './DynamicViewControls'

const PrevNextButton = Button.withProps({
  // Button is polymorphic, but we dont want it to inherit the motion props
  component: m.button as any as 'button',
  variant: 'light',
  size: 'xs',
  fw: '500',
})

const ParallelFrame = () => {
  const { portalProps } = useMantinePortalProps()
  return (
    <Portal {...portalProps}>
      <Box
        css={{
          position: 'absolute',
          margin: '0',
          padding: '0',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          border: `2px solid`,
          borderColor: 'mantine.colors.orange[6]',
          pointerEvents: 'none',
          md: {
            borderWidth: 4,
          },
        }}
      >
      </Box>
    </Portal>
  )
}

export function ActiveWalkthroughControls() {
  const diagram = useDiagram()
  const {
    isParallel,
    hasNext,
    hasPrevious,
    currentStep,
    totalSteps,
  } = useDiagramContext(s => {
    const currentStepIndex = s.xyedges.findIndex(e => e.id === s.activeWalkthrough?.stepId)
    return ({
      isParallel: isTruthy(s.activeWalkthrough?.parallelPrefix),
      hasNext: currentStepIndex < s.xyedges.length - 1,
      hasPrevious: currentStepIndex > 0,
      currentStep: currentStepIndex + 1,
      totalSteps: s.xyedges.length,
    })
  })

  return (
    <AnimatePresence propagate>
      <TriggerWalkthroughButton
        variant="light"
        size="xs"
        color="orange"
        mr={'sm'}
        onClick={e => {
          e.stopPropagation()
          diagram.stopWalkthrough()
        }}
        rightSection={<IconPlayerStopFilled size={10} />}
      >
        Stop
      </TriggerWalkthroughButton>

      <PrevNextButton
        key="prev"
        disabled={!hasPrevious}
        onClick={() => diagram.walkthroughStep('previous')}
        leftSection={<IconPlayerSkipBackFilled size={10} />}
      >
        Previous
      </PrevNextButton>

      <Badge
        key="step-badge"
        component={m.div}
        size="md"
        radius="sm"
        // fw={500}
        variant={isParallel ? 'gradient' : 'transparent'}
        gradient={{ from: 'red', to: 'orange', deg: 90 }}
        rightSection={
          <m.div
            className={css({
              fontSize: 'xxs',
              display: isParallel ? 'block' : 'none',
            })}>
            parallel
          </m.div>
        }
        className={css({
          alignItems: 'baseline',
        })}
      >
        <m.span>
          {currentStep} / {totalSteps}
        </m.span>
      </Badge>

      <PrevNextButton
        key="next"
        disabled={!hasNext}
        onClick={() => diagram.walkthroughStep('next')}
        rightSection={<IconPlayerSkipForwardFilled size={10} />}
      >
        Next
      </PrevNextButton>
      {isParallel && <ParallelFrame />}
    </AnimatePresence>
  )
}
