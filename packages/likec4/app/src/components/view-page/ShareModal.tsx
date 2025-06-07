import {
  Button,
  Group,
  ModalBody,
  ModalContent,
  ModalOverlay,
  ModalRoot,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from '@mantine/core'
import { useState } from 'react'
import { useCurrentDiagram } from '../../hooks'
import { EmbedPanel } from './share-modal/EmbedPanel'
import { WebcomponentsPanel } from './share-modal/WebcomponentsPanel'

type ShareModalOpts = {
  onClose: () => void
}

export function ShareModal({
  onClose,
}: ShareModalOpts) {
  const diagram = useCurrentDiagram()
  const [activeTab, setActiveTab] = useState('webcomponent')
  if (!diagram) {
    return null
  }
  return (
    <ModalRoot
      size={'xl'}
      opened
      onClose={onClose}>
      <ModalOverlay backgroundOpacity={0.5} blur={3} />
      <ModalContent>
        <ModalBody>
          <Tabs value={activeTab} onChange={tab => setActiveTab(tab ?? 'webcomponent')}>
            <TabsList>
              <TabsTab value="webcomponent">Webcomponent</TabsTab>
              <TabsTab value="embed">Embedded</TabsTab>
            </TabsList>

            <TabsPanel value="embed" pt={'md'}>
              <EmbedPanel diagram={diagram} />
            </TabsPanel>
            <TabsPanel value="webcomponent" pt={'md'}>
              <WebcomponentsPanel diagram={diagram} />
            </TabsPanel>
          </Tabs>
          <Group justify="flex-end" mt={'lg'}>
            <Button size="sm" onClick={onClose}>Close</Button>
          </Group>
        </ModalBody>
      </ModalContent>
    </ModalRoot>
  )
}
