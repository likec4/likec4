import { css } from '@likec4/styles/css'
import { hstack } from '@likec4/styles/patterns'
import { IconChevronRight } from '@tabler/icons-react'
import { type Variants, AnimatePresence, LayoutGroup } from 'motion/react'
import * as m from 'motion/react-m'
import { NavigationPanel as StyledNavigationPanel } from '../../components/NavigationPanel'
import type { CurrentViewModel } from '../../hooks/useCurrentViewModel'

import { useNavigationActorRef } from '../hooks'

const breadcrumbAnimation = {
  initial: { opacity: 0, translateX: -5, translateY: 0 },
  animate: {
    opacity: 1,
    translateX: 0,
    translateY: 0,
    transition: {
      duration: 0.17,
    },
  },
  exit: {
    opacity: 0,
    translateX: -5,
    translateY: 0,
    transition: {
      duration: 0.09,
    },
  },
  whileTap: {
    translateY: 1,
  },
} satisfies Variants

interface NavigationBreadcrumbsProps {
  viewTitle: string
  viewModel: CurrentViewModel | null
}
export function NavigationBreadcrumbs({ viewTitle, viewModel }: NavigationBreadcrumbsProps) {
  const actor = useNavigationActorRef()

  const folder = viewModel?.folder
  const folders = !folder || folder.isRoot ? [] : folder.breadcrumbs.map(s => ({
    folderPath: s.path,
    title: s.title,
  }))

  const folderBreadcrumbs = folders.reduceRight(
    (prev, { folderPath, title }, index, all) => [
      <StyledNavigationPanel.Breadcrumb
        key={folderPath}
        layoutId={`folder-${index}`}
        layoutAnchor={false}
        layout="position"
        data-dimmed="true"
        css={{
          userSelect: 'none',
          maxWidth: '[150px]',
          display: {
            base: 'none',
            '@/md': 'block',
          },
        }}
        {...breadcrumbAnimation}
        title={title}
        onMouseEnter={() => actor.send({ type: 'breadcrumbs.mouseEnter.folder', folderPath })}
        onMouseLeave={() => actor.send({ type: 'breadcrumbs.mouseLeave.folder', folderPath })}
        onClick={e => {
          e.stopPropagation()
          actor.send({ type: 'breadcrumbs.click.folder', folderPath })
        }}
      >
        {title}
        <IconChevronRight
          className={css({ color: 'text.non-essential' })}
          style={{ verticalAlign: 'text-bottom', height: '16px' }}
          size={16} />
      </StyledNavigationPanel.Breadcrumb>,
      ...prev,
    ],
    [] as React.ReactNode[],
  )

  return (
    <m.div
      layout="size"
      className={hstack({
        position: 'relative',
        gap: '1',
        flexShrink: 1,
        flexGrow: 1,
        flexWrap: 'nowrap',
        overflow: 'hidden',
      })}>
      <LayoutGroup id="navigation-panel-breadcrumbs">
        <AnimatePresence mode="popLayout" anchorX="left">
          {folderBreadcrumbs}
          <StyledNavigationPanel.Breadcrumb
            key={'view-title'}
            layout="position"
            {...breadcrumbAnimation}
            css={{
              userSelect: 'none',
            }}
            title={viewTitle}
            onMouseEnter={() => actor.send({ type: 'breadcrumbs.mouseEnter.viewtitle' })}
            onMouseLeave={() => actor.send({ type: 'breadcrumbs.mouseLeave.viewtitle' })}
            onClick={e => {
              e.stopPropagation()
              actor.send({ type: 'breadcrumbs.click.viewtitle' })
            }}
          >
            {viewTitle}
          </StyledNavigationPanel.Breadcrumb>
        </AnimatePresence>
      </LayoutGroup>
    </m.div>
  )
}
