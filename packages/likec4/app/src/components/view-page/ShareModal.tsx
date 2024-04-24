import type { DiagramView } from '@likec4/diagrams'
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
  TabsTab
} from '@mantine/core'
import { useState } from 'react'
import { EmbedPanel } from './share-modal/EmbedPanel'
import { WebcomponentsPanel } from './share-modal/WebcomponentsPanel'

type ShareModalOpts = {
  diagram: DiagramView
  opened: boolean
  onClose: () => void
}

export function ShareModal({
  opened,
  onClose,
  diagram
}: ShareModalOpts) {
  const [activeTab, setActiveTab] = useState('webcomponent')
  return (
    <ModalRoot
      size={'xl'}
      opened={opened}
      keepMounted
      onClose={onClose}>
      <ModalOverlay backgroundOpacity={0.5} blur={3} />
      <ModalContent>
        <ModalBody>
          <Tabs value={activeTab} onChange={tab => setActiveTab(tab ?? 'webcomponent')}>
            <TabsList>
              <TabsTab value="webcomponent">Webcomponent</TabsTab>
              <TabsTab value="embed">Embed</TabsTab>
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
