import { NavigationPanel } from '../../components/NavigationPanel'

export const ProjectsOverviewPanel = () => {
  return (
    <NavigationPanel.Root>
      <NavigationPanel.Body>
        <NavigationPanel.Logo />
        <NavigationPanel.Label>
          Projects Overview
        </NavigationPanel.Label>
      </NavigationPanel.Body>
    </NavigationPanel.Root>
  )
}
