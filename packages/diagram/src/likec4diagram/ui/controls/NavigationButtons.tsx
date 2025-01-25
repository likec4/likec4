import { IconChevronRight } from '@tabler/icons-react'

import { AnimatePresence, m } from 'framer-motion'

import { Group } from '@mantine/core'
import { IconChevronLeft, IconMenu2 } from '@tabler/icons-react'
import clsx from 'clsx'
import { LayoutGroup } from 'framer-motion'
import { useDiagramEventHandlers } from '../../../context'
import { useDiagram } from '../../../hooks/useDiagram'
import { useDiagramContext } from '../../../hooks/useDiagramContext'
import { ActionIcon } from './_shared'
import * as css from './styles.css'

export const NavigationButtons = () => {
  const diagram = useDiagram()
  const { onBurgerMenuClick } = useDiagramEventHandlers()
  const {
    hasStepBack,
    hasStepForward,
  } = useDiagramContext(s => ({
    hasStepBack: s.navigationHistory.currentIndex > 0,
    hasStepForward: s.navigationHistory.currentIndex < s.navigationHistory.history.length - 1,
  }))
  return (
    <LayoutGroup>
      <Group
        className={clsx(css.navigationButtons, 'likec4-navigation-webview')}
        align="flex-start"
        gap={'xs'}>
        {onBurgerMenuClick && (
          <ActionIcon
            onClick={e => {
              e.stopPropagation()
              onBurgerMenuClick()
            }}>
            <IconMenu2 />
          </ActionIcon>
        )}
        <AnimatePresence>
          {hasStepBack && (
            <m.div
              layout
              initial={{ opacity: 0.05, transform: 'translateX(-10px)' }}
              animate={{ opacity: 1, transform: 'translateX(0)' }}
              exit={{
                opacity: 0.05,
                transform: 'translateX(-10px)',
              }}
              key={'back'}>
              <ActionIcon
                onClick={e => {
                  e.stopPropagation()
                  diagram.navigate('back')
                }}>
                <IconChevronLeft />
              </ActionIcon>
            </m.div>
          )}
          {hasStepForward && (
            <m.div
              layout
              initial={{ opacity: 0.05, transform: 'translateX(10px)' }}
              animate={{ opacity: 1, transform: 'translateX(0)' }}
              exit={{
                opacity: 0,
                transform: 'translateX(10px)',
              }}
              key={'forward'}>
              <ActionIcon
                onClick={e => {
                  e.stopPropagation()
                  diagram.navigate('forward')
                }}>
                <IconChevronRight />
              </ActionIcon>
            </m.div>
          )}
        </AnimatePresence>
      </Group>
    </LayoutGroup>
  )
}
