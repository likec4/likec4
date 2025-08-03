import { IconMenu2 } from '@tabler/icons-react'
import { useDiagramEventHandlers } from '../../context/DiagramEventHandlers'
import { PanelActionIcon } from '../_common'
import { useNavigationActor } from '../hooks'

export const BurgerButton = () => {
  const actor = useNavigationActor()
  const { onBurgerMenuClick } = useDiagramEventHandlers()
  return (
    <PanelActionIcon
      layout="position"
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
      children={<IconMenu2 style={{ width: '80%', height: '80%' }} />}
    />
  )
}
