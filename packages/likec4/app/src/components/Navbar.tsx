import type { DiagramApi } from '@likec4/diagrams'
import { CaretDownIcon, InfoCircledIcon, Share1Icon as ShareIcon } from '@radix-ui/react-icons'
import {
  Box,
  Button,
  Callout,
  Dialog,
  DropdownMenu,
  Flex,
  Tabs,
  Text,
  TextArea
} from '@radix-ui/themes'
import type { PropsWithChildren } from 'react'
import { cn } from '~/utils'
import styles from './Navbar.module.css'

const ExportMenu = ({ diagramApi, children }: PropsWithChildren<{ diagramApi: DiagramApi }>) => (
  <DropdownMenu.Root>
    <DropdownMenu.Trigger>{children}</DropdownMenu.Trigger>
    <DropdownMenu.Content>
      <DropdownMenu.Label>
        <Text weight='medium'>Current diagram</Text>
      </DropdownMenu.Label>
      <DropdownMenu.Group>
        <DropdownMenu.Item
          onClick={_ => {
            // const { boundingBox } = diagramApi.diagramView()
            console.log('Serialized: ', diagramApi.stage().toObject())
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
        <Text weight='medium'>All diagrams</Text>
      </DropdownMenu.Label>
      <DropdownMenu.Group>
        <DropdownMenu.Item>Download as ZIP</DropdownMenu.Item>
      </DropdownMenu.Group>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
)

const ShareDialog = () => (
  <Dialog.Content size={'2'}>
    <Tabs.Root defaultValue='embeded'>
      <Tabs.List>
        <Tabs.Trigger value='embeded'>Embeded code</Tabs.Trigger>
        <Tabs.Trigger value='public'>Public URL</Tabs.Trigger>
      </Tabs.List>

      <Box px='1' py='4'>
        <Tabs.Content value='embeded'>
          <Flex direction='column' gap='4'>
            {/* <label>
              <Text as='div' size='2' mb='1' weight='medium'>
                Deployed URL
              </Text>
              <TextField.Input defaultValue='Freja Johnsen' placeholder='Enter your full name' />
            </label> */}
            <label>
              <Text as='div' size='2' mb='1' weight='medium'>
                Code
              </Text>
              <TextArea
                color='gray'
                autoFocus
                variant='soft'
                placeholder='Later here is generated code...'
              />
            </label>
          </Flex>
        </Tabs.Content>

        <Tabs.Content value='public'>
          <Callout.Root color='amber'>
            <Callout.Icon>
              <InfoCircledIcon />
            </Callout.Icon>
            <Callout.Text>This feature is not implemented yet.</Callout.Text>
          </Callout.Root>
        </Tabs.Content>
      </Box>
    </Tabs.Root>

    <Flex gap='3' mt='1' justify='end'>
      <Dialog.Close>
        <Button variant='soft' color='gray'>
          Close
        </Button>
      </Dialog.Close>
    </Flex>
  </Dialog.Content>
)

const Navbar = ({ diagramApi }: { diagramApi: DiagramApi }) => {
  return (
    <Flex position='fixed' top='0' right='0' p='2' justify='end' className={cn(styles.navbar)}>
      <Flex grow='0' gap='3' pr='7' align='center'>
        <Dialog.Root>
          <Dialog.Trigger>
            <Button variant='solid'>
              <ShareIcon />
              <Text>Share</Text>
            </Button>
          </Dialog.Trigger>
          <ShareDialog />
        </Dialog.Root>
        <ExportMenu diagramApi={diagramApi}>
          <Button variant='soft' color='gray'>
            <Text>Export</Text>
            <CaretDownIcon />
          </Button>
        </ExportMenu>
      </Flex>
    </Flex>
  )
}

export default Navbar
