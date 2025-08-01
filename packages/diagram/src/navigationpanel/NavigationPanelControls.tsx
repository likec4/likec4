import { cx } from '@likec4/styles/css'
import { Box } from '@likec4/styles/jsx'
import { hstack } from '@likec4/styles/patterns'
import {
  UnstyledButton,
} from '@mantine/core'
import {
  IconMenu2,
  IconSearch,
} from '@tabler/icons-react'
import { useSelector } from '@xstate/react'
import { isMacOs } from '@xyflow/system'
import { deepEqual } from 'fast-equals'
import { AnimatePresence } from 'motion/react'
import * as m from 'motion/react-m'
import { useEnabledFeatures } from '../context/DiagramFeatures'
import { useDiagram } from '../hooks/useDiagram'
import { BreadcrumbsSeparator, PanelActionIcon } from './_common'
import { type NavigationPanelActorSnapshot } from './actor'
import { useNavigationActorRef } from './hooks'
import { NavigationButtons } from './NavigationButtons'
import { breadcrumbTitle } from './styles.css'
import { StartWalkthroughButton } from './walkthrough'

const selectBreadcrumbs = ({ context }: NavigationPanelActorSnapshot) => {
  const folder = context.viewModel.folder
  return {
    folders: folder.isRoot ? [] : folder.breadcrumbs.map(s => ({
      folderPath: s.path,
      title: s.title,
    })),
    viewId: context.viewModel.id,
    viewTitle: context.viewModel.titleOrUntitled,
    isDynamicView: context.viewModel.isDynamicView(),
    hasLinks: context.viewModel.links.length > 0,
  }
}

export const NavigationPanelControls = () => {
  const actor = useNavigationActorRef()
  const {
    enableSearch,
    enableNavigationButtons,
    enableDynamicViewWalkthrough,
  } = useEnabledFeatures()
  const {
    folders,
    viewTitle,
    isDynamicView,
  } = useSelector(actor, selectBreadcrumbs, deepEqual)

  const folderBreadcrumbs = folders.flatMap(({ folderPath, title }, i) => [
    <UnstyledButton
      key={folderPath}
      component={m.button}
      className={cx(
        breadcrumbTitle({ dimmed: true, truncate: true }),
        'mantine-active',
      )}
      title={title}
      onMouseEnter={() => actor.send({ type: 'breadcrumbs.mouseEnter.folder', folderPath })}
      onMouseLeave={() => actor.send({ type: 'breadcrumbs.mouseLeave.folder', folderPath })}
      onClick={e => {
        e.stopPropagation()
        actor.send({ type: 'breadcrumbs.click.folder', folderPath })
      }}
    >
      {title}
    </UnstyledButton>,
    <BreadcrumbsSeparator key={`separator-${i}`} />,
  ])

  const viewBreadcrumb = (
    <UnstyledButton
      key={'view-title'}
      component={m.button}
      className={cx(
        breadcrumbTitle({ truncate: true }),
        'mantine-active',
      )}
      maw={300}
      title={viewTitle}
      onMouseEnter={() => actor.send({ type: 'breadcrumbs.mouseEnter.viewtitle' })}
      onMouseLeave={() => actor.send({ type: 'breadcrumbs.mouseLeave.viewtitle' })}
      onClick={e => {
        e.stopPropagation()
        actor.send({ type: 'breadcrumbs.click.viewtitle' })
      }}
    >
      {viewTitle}
    </UnstyledButton>
  )

  return (
    <AnimatePresence propagate>
      <PanelActionIcon
        variant="subtle"
        layout="position"
        component={m.button}
        whileHover={{
          scale: 1.085,
        }}
        whileTap={{
          scale: 1,
          translateY: 1,
        }}
        onMouseEnter={e => {
          actor.send({ type: 'breadcrumbs.mouseEnter.root' })
        }}
        onMouseLeave={e => {
          actor.send({ type: 'breadcrumbs.mouseLeave.root' })
        }}
        onClick={e => {
          e.stopPropagation()
          actor.send({ type: 'breadcrumbs.click.root' })
        }}
        children={<IconMenu2 style={{ width: '80%', height: '80%' }} />}
      />
      {enableNavigationButtons && <NavigationButtons />}
      <m.div
        className={hstack({
          gap: 3,
          marginRight: 'md',
        })}>
        {folderBreadcrumbs}
        {viewBreadcrumb}
      </m.div>
      {
        /* <HStack gap={1}>
          <PanelActionIcon
            variant="subtle"
            size={24}
            component={m.button}
            whileHover={{
              scale: 1.085,
            }}
            whileTap={{
              scale: 1,
              translateY: 1,
            }}
            children={<IconInfoCircleFilled style={{ width: '85%', height: '85%' }} />}
          />
          <PanelActionIcon
            variant="subtle"
            size={24}
            component={m.button}
            whileHover={{
              scale: 1.085,
            }}
            whileTap={{
              scale: 1,
              translateY: 1,
            }}
            children={<IconLink style={{ width: '85%', height: '85%' }} />}
          />
        </HStack> */
      }

      {enableDynamicViewWalkthrough && isDynamicView && <StartWalkthroughButton />}
      {enableSearch && <SearchControl />}
    </AnimatePresence>
  )
}

function SearchControl() {
  const diagram = useDiagram()
  const isMac = isMacOs()

  return (
    <UnstyledButton
      component={m.button}
      layout="position"
      onClick={e => {
        e.stopPropagation()
        diagram.openSearch()
      }}
      whileTap={{
        translateY: 1,
      }}
      className={cx(
        'group',
        hstack({
          gap: '2xs',
          paddingInline: 'sm',
          paddingBlock: '2xs',
          rounded: 'sm',
          userSelect: 'none',
          cursor: 'pointer',
          color: {
            base: 'mantine.colors.dark.lightColor',
            _dark: 'mantine.colors.text/80',
            _hover: {
              base: 'mantine.colors.dark.lightColor',
              _dark: 'mantine.colors.text',
            },
          },
          backgroundColor: {
            base: 'mantine.colors.gray[1]',
            _dark: 'mantine.colors.dark[7]/70',
            _hover: {
              base: 'mantine.colors.gray[2]',
              _dark: 'mantine.colors.dark[8]',
            },
          },
          // backgroundColor: {
          //   base: 'mantine.colors.dark.light/80',
          //   _dark: 'mantine.colors.dark[7]/70',
          //   _hover: {
          //     base: 'mantine.colors.dark.lightHover/80',
          //     _dark: 'mantine.colors.dark[8]',
          //   },
          // },
        }),
      )}>
      <IconSearch size={14} stroke={2.5} />
      <Box
        css={{
          fontSize: '11px',
          fontWeight: 600,
          lineHeight: 1,
          opacity: 0.8,
        }}>
        {isMac ? '⌘ + K' : 'Ctrl + K'}
      </Box>
    </UnstyledButton>
  )
}
