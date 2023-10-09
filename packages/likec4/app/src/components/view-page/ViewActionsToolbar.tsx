import type { DiagramApi, DiagramView } from '@likec4/diagrams'
import { CaretDownIcon, Share1Icon as ShareIcon } from '@radix-ui/react-icons'
import { Button, Dialog, DropdownMenu, Flex, Text } from '@radix-ui/themes'
import type { PropsWithChildren } from 'react'
import { ThemePanelToggle } from '../ThemePanelToggle'
import { ShareDialog } from './ShareDialog'

const ExportMenu = ({ diagramApi, children }: PropsWithChildren<{ diagramApi: DiagramApi }>) => (
  <DropdownMenu.Root>
    <DropdownMenu.Trigger>{children}</DropdownMenu.Trigger>
    <DropdownMenu.Content>
      <DropdownMenu.Label>
        <Text weight='medium'>Current view</Text>
      </DropdownMenu.Label>
      <DropdownMenu.Group>
        <DropdownMenu.Item
          onClick={_ => {
            // const { boundingBox } = diagramApi.diagramView()
            console.log('Serialized: ', diagramApi.stage.toObject())
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
          Export as PNG
        </DropdownMenu.Item>
        <DropdownMenu.Item>Export as SVG</DropdownMenu.Item>
      </DropdownMenu.Group>
      <DropdownMenu.Separator />
      <DropdownMenu.Label>
        <Text weight='medium'>All views</Text>
      </DropdownMenu.Label>
      <DropdownMenu.Group>
        <DropdownMenu.Item>Download as ZIP</DropdownMenu.Item>
      </DropdownMenu.Group>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
)

export const ViewActionsToolbar = ({
  diagramApi,
  diagram
}: {
  diagramApi: DiagramApi
  diagram: DiagramView
}) => {
  return (
    <Flex position='fixed' top='0' right='0' p='2' gap={'3'} justify='end'>
      <Dialog.Root>
        <Dialog.Trigger>
          <Button variant='solid'>
            <ShareIcon />
            <Text>Share</Text>
          </Button>
        </Dialog.Trigger>
        <ShareDialog diagram={diagram} />
      </Dialog.Root>
      <ExportMenu diagramApi={diagramApi}>
        <Button variant='soft' color='gray'>
          <Text>Export</Text>
          <CaretDownIcon />
        </Button>
      </ExportMenu>
      <ThemePanelToggle />
    </Flex>
  )
}
