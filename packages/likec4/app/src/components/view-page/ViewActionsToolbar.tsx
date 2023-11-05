import { type DiagramView } from '@likec4/diagrams'
import { CaretDownIcon, Share1Icon as ShareIcon } from '@radix-ui/react-icons'
import { Button, Dialog, DropdownMenu, Flex, Text } from '@radix-ui/themes'
import { useState, type PropsWithChildren } from 'react'
// import { ThemePanelToggle } from '../ThemePanelToggle'
import { DisplayModeSelector } from './DisplayModeSelector'
import ExportDiagram from './ExportDiagram'
import { ShareDialog } from './ShareDialog'

const ExportMenu = ({
  onExport,
  children
}: PropsWithChildren<{ onExport: (format: 'png') => void }>) => (
  <DropdownMenu.Root>
    <DropdownMenu.Trigger>{children}</DropdownMenu.Trigger>
    <DropdownMenu.Content>
      <DropdownMenu.Label>
        <Text weight='medium'>Current view</Text>
      </DropdownMenu.Label>
      <DropdownMenu.Group>
        <DropdownMenu.Item
          onClick={_ => {
            onExport('png')
          }}
        >
          Export as .png
        </DropdownMenu.Item>
        <DropdownMenu.Item disabled>Export as .dot</DropdownMenu.Item>
        <DropdownMenu.Item disabled>Export as .mmd</DropdownMenu.Item>
        <DropdownMenu.Item disabled>Export as .d2</DropdownMenu.Item>
        <DropdownMenu.Item disabled>Export to Draw.io</DropdownMenu.Item>
        <DropdownMenu.Item disabled>Export to Miro</DropdownMenu.Item>
      </DropdownMenu.Group>
      <DropdownMenu.Separator />
      <DropdownMenu.Label>
        <Text weight='medium'>All views</Text>
      </DropdownMenu.Label>
      <DropdownMenu.Group>
        <DropdownMenu.Item disabled>Download as ZIP</DropdownMenu.Item>
      </DropdownMenu.Group>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
)

export const ViewActionsToolbar = ({ diagram }: { diagram: DiagramView }) => {
  const [exportTo, setExportTo] = useState<'png' | null>(null)

  return (
    <Flex
      position='fixed'
      top='0'
      right='0'
      p={{
        initial: '3',
        md: '2'
      }}
      gap={'3'}
      justify='end'
      align='center'
    >
      <DisplayModeSelector />
      <Dialog.Root>
        <Dialog.Trigger>
          <Button
            variant='solid'
            size={{
              initial: '1',
              md: '2'
            }}
          >
            <ShareIcon />
            <Text>Share</Text>
          </Button>
        </Dialog.Trigger>
        <ShareDialog diagram={diagram} />
      </Dialog.Root>
      <ExportMenu onExport={setExportTo}>
        <Button
          variant='soft'
          color='gray'
          size={{
            initial: '1',
            md: '2'
          }}
        >
          <Text>Export</Text>
          <CaretDownIcon />
        </Button>
      </ExportMenu>
      {exportTo === 'png' && (
        <ExportDiagram
          key={'export-diagram-png'}
          diagram={diagram}
          onCompleted={() => setExportTo(null)}
        />
      )}
      {/* <ThemePanelToggle /> */}
    </Flex>
  )
}
