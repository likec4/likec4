import type { DiagramView } from '@likec4/diagrams'
import {
  ActionIcon,
  Alert,
  Box,
  Button,
  Code,
  CopyButton,
  Group,
  type MantineColorScheme,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  ModalRoot,
  rem,
  Select,
  Stack,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
  Text,
  Textarea,
  Tooltip,
  useMantineColorScheme
} from '@mantine/core'
import { IconAlertTriangle, IconCheck, IconCopy } from '@tabler/icons-react'
import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'

// const embedCode = (diagram: DiagramView, theme: string) => {
//   // const url = $pages.embed.url(diagram.id)
//   // const padding = 20

//   // url.searchParams.set('padding', `${padding}`)
//   // if (theme !== 'system') {
//   //   url.searchParams.set('theme', theme)
//   // } else {
//   //   url.searchParams.delete('theme')
//   // }

//   const width = diagram.width + padding * 2
//   const height = diagram.height + padding * 2

//   const code = `
// <div style="aspect-ratio:${width}/${height};width:100%;height:auto;max-width:${width}px;margin:0 auto">
//   <iframe src="${url.href}" width="100%" height="100%" style="border:0;background:transparent;"></iframe>
// </div>
// `.trim()

//   return {
//     code,
//     href: url.href
//   }
// }
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

const AlertLocalhost = () => (
  <Alert
    color="yellow"
    icon={<IconAlertTriangle />}
    title="Localhost URL"
  >
    <Text c={'yellow'} size="sm">
      You need to deploy your project to make it available on the internet
    </Text>
  </Alert>
)

const CopyButtonChild = ({ copied, copy }: { copied: boolean; copy: () => void }) => (
  <Button
    size="xs"
    color={copied ? 'teal' : 'gray'}
    variant={'light'}
    leftSection={copied
      ? <IconCheck style={{ width: rem(16) }} />
      : <IconCopy style={{ width: rem(16) }} />}
    onClick={copy}>
    {copied ? 'Copied' : 'Copy to clipboard'}
  </Button>
)

const EmbedPanel = ({ diagram }: { diagram: DiagramView }) => {
  const router = useRouter()

  const { colorScheme } = useMantineColorScheme()
  const [theme, setTheme] = useState<MantineColorScheme>(colorScheme)

  const padding = 20
  const url = new URL(
    router.buildLocation({
      to: '/embed/$viewId',
      params: { viewId: diagram.id },
      search: {
        padding,
        theme: theme !== 'auto' ? theme : undefined
      }
    }).href,
    window.location.href
  )
  const width = diagram.width + padding * 2
  const height = diagram.height + padding * 2
  const href = url.href

  const code = `
<div style="aspect-ratio:${width}/${height};width:100%;height:auto;max-width:${width}px;margin:0 auto">
  <iframe src="${href}" width="100%" height="100%" style="border:0;background:transparent;"></iframe>
</div>
`.trim()

  return (
    <Stack>
      {code.includes('http://localhost') && <AlertLocalhost />}
      <Box>
        <Text size="sm">
          Embeded view is an iframe with a static diagram
        </Text>
      </Box>
      <Stack gap={'xs'}>
        <Group justify="space-between">
          <Box>
            <Text fw={'500'} size="sm">Code</Text>
          </Box>
          <Box>
            <CopyButton value={code} timeout={1500} children={CopyButtonChild} />
            {
              /* <CopyButton value={code} timeout={1500}>
              {({ copied, copy }) => (
                <Button
                  size="xs"
                  color={copied ? 'teal' : 'gray'}
                  variant={copied ? 'light' : 'light'}
                  leftSection={copied
                    ? <IconCheck style={{ width: rem(16) }} />
                    : <IconCopy style={{ width: rem(16) }} />}
                  onClick={copy}>
                  {copied ? 'Copied' : 'Copy to clipboard'}
                </Button>
              )}
            </CopyButton> */
            }
            {/* <Text>Open</Text> */}
          </Box>
        </Group>
        <Code block>
          {code}
        </Code>
        <Box
          style={{
            'alignSelf': 'flex-start'
          }}>
          <Select
            label="Color scheme"
            value={theme}
            allowDeselect={false}
            onChange={v => setTheme(v as MantineColorScheme ?? 'auto')}
            data={[
              { value: 'auto', label: 'Auto' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' }
            ]}
          />
        </Box>
      </Stack>
    </Stack>
  )
}

const WebcomponentsPanel = ({ diagram }: { diagram: DiagramView }) => {
  const router = useRouter()

  let base = router.basepath.endsWith('/') ? router.basepath : `${router.basepath}/`
  const url = new URL(
    `${base}likec4-views.js`,
    window.location.href
  )
  const href = url.href

  const jscode = `
  <script src="${href}" defer></script>
`.trim()

  const htmlCode = `
  <likec4-view view-id="${encodeURIComponent(diagram.id)}" keep-aspect-ratio></likec4-view>
`.trim()

  return (
    <Stack>
      {jscode.includes('http://localhost') && <AlertLocalhost />}
      <Box>
        <Text size="sm">
          Webcomponents are custom elements that can be used in any HTML page, they are more flexible than
          iframes.<br />
          You need to add the following to your page:
        </Text>
      </Box>
      <Stack gap={'xs'}>
        <Group justify="space-between">
          <Box>
            <Text fw={'500'} size="sm">JavaScript</Text>
          </Box>
          <Box>
            <CopyButton
              value={jscode}
              timeout={1500}
              children={CopyButtonChild} />
          </Box>
        </Group>
        <Code block>
          {jscode}
        </Code>
        <Box>
          <Text size="sm" c={'dimmed'}>
            This script contains all diagrams and defines a custom element (webcomponent) to render them. Script should
            be inserted once in the <code>&lt;head&gt;</code> or at the end of the <code>&lt;body&gt;</code> tag.
          </Text>
        </Box>
      </Stack>
      <Stack gap={'xs'}>
        <Group justify="space-between">
          <Box>
            <Text fw={'500'} size="sm">HTML</Text>
          </Box>
          <Box>
            <CopyButton
              value={htmlCode}
              timeout={1500}
              children={CopyButtonChild} />
          </Box>
        </Group>
        <Code block>
          {htmlCode}
        </Code>
        <Box>
          <Text size="sm" c={'dimmed'}>
            Pages with included script can use the <code>&lt;likec4-view&gt;</code> element anywhere.
          </Text>
        </Box>
      </Stack>
    </Stack>
  )
}
