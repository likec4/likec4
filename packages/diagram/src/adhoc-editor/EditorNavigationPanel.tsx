import { useSelector } from '@xstate/react'
import { prop } from 'remeda'
import { NavigationPanel } from '../components/NavigationPanel'
import { selectFromContext, useAdhocEditorActor } from './hooks'
import { ViewRulesPanel } from './viewrules/ViewRulesPanel'

const selectRules = selectFromContext(prop('rules'))
export const EditorNavigationPanel = () => {
  const actorRef = useAdhocEditorActor()
  const rules = useSelector(actorRef, selectRules)

  return (
    <NavigationPanel.Root>
      <NavigationPanel.Body>
        <NavigationPanel.Logo />
        <NavigationPanel.Label>
          View Editor
        </NavigationPanel.Label>
      </NavigationPanel.Body>
      {rules.length > 0 && (
        <NavigationPanel.Dropdown css={{ maxW: '250px' }}>
          <ViewRulesPanel
            rules={rules}
            onToggle={rule => {
              actorRef.send({ type: 'toggle.rule', ruleId: rule.id })
            }}
            onDelete={rule => {
              actorRef.send({ type: 'delete.rule', ruleId: rule.id })
            }}
          />
        </NavigationPanel.Dropdown>
      )}
    </NavigationPanel.Root>
  )
}
