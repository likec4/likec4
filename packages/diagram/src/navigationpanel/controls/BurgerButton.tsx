import { css, cx } from '@likec4/styles/css'
import { hstack } from '@likec4/styles/patterns'
import { UnstyledButton } from '@mantine/core'
import * as m from 'motion/react-m'
import { Logo, LogoIcon } from '../../components/Logo'
import { useDiagramEventHandlers } from '../../context/DiagramEventHandlers'
import { useNavigationActor } from '../hooks'

export const BurgerButton = () => {
  const actor = useNavigationActor()
  const { onBurgerMenuClick } = useDiagramEventHandlers()
  return (
    <m.div layout="position">
      <UnstyledButton
        onMouseEnter={() => {
          actor.send({ type: 'breadcrumbs.mouseEnter.root' })
        }}
        onMouseLeave={() => {
          actor.send({ type: 'breadcrumbs.mouseLeave.root' })
        }}
        onClick={e => {
          e.stopPropagation()
          if (onBurgerMenuClick && actor.isOpened()) {
            setTimeout(() => {
              onBurgerMenuClick()
            }, 100)
          }
          actor.send({ type: 'breadcrumbs.click.root' })
        }}
        className={cx(
          'mantine-active',
          hstack({
            padding: '0.5',
            // _active: {
            //   transform: 'translateY(1px)',
            // },
            width: {
              base: '[20px]',
              '@/md': '[64px]',
            },
          }),
        )}
      >
        <Logo
          className={css({
            display: {
              base: 'none',
              '@/md': 'block',
            },
          })}
        />
        <LogoIcon
          className={css({
            display: {
              base: 'block',
              '@/md': 'none',
            },
          })}
        />
      </UnstyledButton>
    </m.div>
  )
}
