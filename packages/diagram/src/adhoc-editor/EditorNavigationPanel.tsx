import { prop } from 'remeda'
import { NavigationPanel } from '../components/NavigationPanel'
import { selectFromContext, useAdhocEditorSnapshot } from './hooks'
import { ViewRulesPanel } from './viewrules/ViewRulesPanel'

const selectRules = selectFromContext(prop('rules'))
export const EditorNavigationPanel = () => {
  const rules = useAdhocEditorSnapshot(selectRules)

  return (
    <NavigationPanel.Root>
      <NavigationPanel.Body>
        <NavigationPanel.Logo />
        <NavigationPanel.Label>
          View Editor
        </NavigationPanel.Label>
      </NavigationPanel.Body>
      {rules.length > 0 && (
        <NavigationPanel.Dropdown>
          <ViewRulesPanel rules={rules} />
        </NavigationPanel.Dropdown>
      )}
    </NavigationPanel.Root>
  )
}
