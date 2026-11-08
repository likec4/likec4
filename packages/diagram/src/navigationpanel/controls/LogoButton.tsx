import * as m from 'motion/react-m'
import { NavigationPanel } from '../../components/NavigationPanel'
import { useDiagramEventHandlers } from '../../context/DiagramEventHandlers'
import { useNavigationActor } from '../hooks'

export const LogoButton = () => {
  const actor = useNavigationActor()
  const { onLogoClick } = useDiagramEventHandlers()
  return (
    <m.div layout="position">
      <NavigationPanel.Logo
        onMouseEnter={() => {
          actor.send({ type: 'breadcrumbs.mouseEnter.root' })
        }}
        onMouseLeave={() => {
          actor.send({ type: 'breadcrumbs.mouseLeave.root' })
        }}
        onClick={e => {
          e.stopPropagation()
          if (onLogoClick && actor.isOpened()) {
            setTimeout(() => {
              onLogoClick()
            }, 100)
          }
          actor.send({ type: 'breadcrumbs.click.root' })
        }}
      />
    </m.div>
  )
}
