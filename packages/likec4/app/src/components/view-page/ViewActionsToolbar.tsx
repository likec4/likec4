import { type DiagramApi, type DiagramView } from '@likec4/diagrams'
import { CaretDownIcon, Share1Icon as ShareIcon } from '@radix-ui/react-icons'
import { Button, Dialog, DropdownMenu, Flex, IconButton, Separator, Text } from '@radix-ui/themes'
import { useState, type PropsWithChildren } from 'react'
// import { ThemePanelToggle } from '../ThemePanelToggle'
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
            // const { boundingBox } = diagramApi.diagramView()
            // console.log('Serialized: ', diagramApi.stage.toObject())
            // const k = new KonvaCore.Canvas({
            //   height: diagramApi.
            // })
            // diagramApi.stage().toBlob({
            //   ...boundingBox,
            //   callback(blob) {
            //     const url = URL.createObjectURL(blob)
            //     window.open(url)
            //     // const a = document.createElement('a')
            //     // a.href = url
            //     // a.download = 'diagram.png'
            //     // a.click()
            //     URL.revokeObjectURL(url)
            //   },
            // })
          }}
        >
          Export as .png
        </DropdownMenu.Item>
        <DropdownMenu.Item disabled>Export as .dot</DropdownMenu.Item>
        <DropdownMenu.Item disabled>Export as .mmd</DropdownMenu.Item>
        <DropdownMenu.Item disabled>Export as .d2</DropdownMenu.Item>
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

export const ViewActionsToolbar = ({
  diagram
}: {
  diagramApi: DiagramApi
  diagram: DiagramView
}) => {
  const [exportTo, setExportTo] = useState<'png' | null>(null)

  return (
    <Flex position='fixed' top='0' right='0' p='2' gap={'3'} justify='end' align='center'>
      <Flex
        display={{
          initial: 'none',
          md: 'flex'
        }}
        gap='3'
        align='center'
      >
        <Button variant='solid' size='1'>
          React
        </Button>
        <Button variant='ghost' size='1'>
          Graphviz
        </Button>
        <Button variant='ghost' size='1'>
          Mermaid
        </Button>
        <IconButton variant='ghost' size='1'>
          <CaretDownIcon />
        </IconButton>
        <Separator orientation='vertical' />
      </Flex>
      <Dialog.Root>
        <Dialog.Trigger>
          <Button variant='solid'>
            <ShareIcon />
            <Text>Share</Text>
          </Button>
        </Dialog.Trigger>
        <ShareDialog diagram={diagram} />
      </Dialog.Root>
      <ExportMenu onExport={setExportTo}>
        <Button variant='soft' color='gray'>
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
