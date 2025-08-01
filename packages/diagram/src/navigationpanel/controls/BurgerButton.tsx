import { IconMenu2 } from '@tabler/icons-react'
import { useDiagramEventHandlers } from '../../context'
import { PanelActionIcon } from '../_common'
import { useNavigationActorRef } from '../hooks'

export const BurgerButton = () => {
  const actor = useNavigationActorRef()
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
        if (onBurgerMenuClick) {
          actor.send({ type: 'breadcrumbs.mouseLeave.root' })
          setTimeout(() => {
            onBurgerMenuClick()
          }, 100)
        } else {
          actor.send({ type: 'breadcrumbs.click.root' })
        }
      }}
      children={<IconMenu2 style={{ width: '80%', height: '80%' }} />}
    />
  )
}
