import { ActionIcon, Group } from '@mantine/core'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import clsx from 'clsx'
import { AnimatePresence, m } from 'framer-motion'
import { useNavigationHistory } from '../state/hooks'
import * as css from './BackwardForwardPanel.css'

export function BackwardForwardPanel() {
  const { hasBack, hasForward, ops } = useNavigationHistory()

  return (
    <Group
      className={clsx(
        'react-flow__panel',
        css.panel,
        'likec4-navigation-panel'
      )}
      gap={'xs'}>
      <AnimatePresence>
        {hasBack && (
          <m.div
            layout
            initial={{ opacity: 0.05, transform: 'translateX(-10px)' }}
            animate={{ opacity: 1, transform: 'translateX(0)' }}
            exit={{
              opacity: 0.05,
              transform: 'translateX(-10px)'
            }}
            key={'back'}>
            <ActionIcon
              variant="light"
              color="gray"
              onClick={() => ops.back()}>
              <IconChevronLeft />
            </ActionIcon>
          </m.div>
        )}
        {hasForward && (
          <m.div
            layout
            initial={{ opacity: 0.05, transform: 'translateX(10px)' }}
            animate={{ opacity: 1, transform: 'translateX(0)' }}
            exit={{
              opacity: 0,
              transform: 'translateX(10px)'
            }}
            key={'forward'}>
            <ActionIcon
              variant="light"
              color="gray"
              onClick={() => ops.forward()}>
              <IconChevronRight />
            </ActionIcon>
          </m.div>
        )}
      </AnimatePresence>
    </Group>
  )
}
