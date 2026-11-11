import type { CssProperty } from '@likec4/styles/types'
import * as m from 'motion/react-m'
import type { ComponentPropsWithRef } from 'react'
import { NavigationPanel } from '../../components/NavigationPanel'
import { useDiagramEventHandlers } from '../../context/DiagramEventHandlers'
import { customizable } from '../../custom/customizable'
import { useNavigationActor } from '../hooks'

type LogoButtonProps = {
  onClick: React.MouseEventHandler<HTMLButtonElement>
  onMouseEnter: React.MouseEventHandler<HTMLButtonElement>
  onMouseLeave: React.MouseEventHandler<HTMLButtonElement>
} & Omit<ComponentPropsWithRef<'button'>, CssProperty>

// const NavigationPanelLogo = customizable('NavigationPanelLogo')(
//   (props: LogoButtonProps) => <NavigationPanel.Logo {...props} />,
// )
// declare module '@likec4/diagram-customization' {
//   interface RegisterCustomizable {
//     NavigationPanelLogo: register<typeof NavigationPanelLogo>
//   }
// }

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
