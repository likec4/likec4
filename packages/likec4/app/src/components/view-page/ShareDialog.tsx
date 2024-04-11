import type { DiagramView } from '@likec4/diagrams'
import { type MantineColorScheme, useMantineColorScheme } from '@mantine/core'
import { ExclamationTriangleIcon, InfoCircledIcon, OpenInNewWindowIcon } from '@radix-ui/react-icons'
import { Box, Button, Callout, Code, Dialog, Flex, Link, ScrollArea, Select, Tabs, Text } from '@radix-ui/themes'
import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { CopyToClipboard } from '../CopyToClipboard'

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

export const ShareDialog = ({ diagram }: { diagram: DiagramView }) => {
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

  // const { code, href } = embedCode(diagram, theme)

  return (
    <Dialog.Content size="2" style={{ maxWidth: 800, minWidth: 280 }}>
      <Tabs.Root defaultValue="embed">
        <Tabs.List>
          <Tabs.Trigger value="embed">v</Tabs.Trigger>
          <Tabs.Trigger value="script">Webcomponents</Tabs.Trigger>
          <Tabs.Trigger value="public">Public URL</Tabs.Trigger>
        </Tabs.List>

        <Box px="1" py="4">
          <Tabs.Content value="embed">
            <Flex direction="column" gap="4">
              {code.includes('http://localhost') && (
                <Callout.Root size="1" color="amber">
                  <Callout.Icon>
                    <ExclamationTriangleIcon />
                  </Callout.Icon>
                  <Callout.Text>
                    This is a local URL. You need to build your project and deploy to a public URL to make it available
                    for embedding.
                    <br />
                    <Code>likec4 build --help</Code> builds your project as static website (single .html file)
                  </Callout.Text>
                </Callout.Root>
              )}
              <label>
                <Flex direction="row" justify="between">
                  <Text as="div" size="2" weight="medium">
                    Code
                  </Text>
                  <Flex asChild display="inline-flex" gap="1" align="center">
                    <Link size="2" href={href} target="_blank">
                      <Text as="span">Open in new tab</Text>
                      <Text as="span">
                        <OpenInNewWindowIcon width={12} height={12} />
                      </Text>
                    </Link>
                  </Flex>
                </Flex>
                <Box position={'relative'} mt={'1'}>
                  <ScrollArea scrollbars="both" style={{ maxHeight: 200 }}>
                    <Box
                      asChild
                      display={'block'}
                      px="2"
                      py="3"
                      style={{
                        whiteSpace: 'pre'
                      }}
                    >
                      <Code variant="soft" autoFocus>
                        {code}
                      </Code>
                    </Box>
                  </ScrollArea>
                  <CopyToClipboard text={code} />
                </Box>
              </label>
              <Text as="div" size="2" color="gray" trim={'start'}>
                Embeded view is an iframe with a static diagram
              </Text>
              <label>
                <Text as="div" size="2" weight="medium" mb="1">
                  Theme
                </Text>
                <Select.Root size="2" defaultValue={theme} onValueChange={v => setTheme(v as MantineColorScheme)}>
                  <Select.Trigger variant="soft" />
                  <Select.Content>
                    <Select.Item value="auto">Same as system</Select.Item>
                    <Select.Item value="light">Light</Select.Item>
                    <Select.Item value="dark">Dark</Select.Item>
                  </Select.Content>
                </Select.Root>
              </label>
            </Flex>
          </Tabs.Content>

          <Tabs.Content value="public">
            <Callout.Root color="amber">
              <Callout.Icon>
                <InfoCircledIcon />
              </Callout.Icon>
              <Callout.Text>This feature is not implemented yet.</Callout.Text>
            </Callout.Root>
          </Tabs.Content>
          <Tabs.Content value="script">
            <Callout.Root color="amber">
              <Callout.Icon>
                <InfoCircledIcon />
              </Callout.Icon>
              <Callout.Text>This feature is not implemented yet.</Callout.Text>
            </Callout.Root>
          </Tabs.Content>
        </Box>
      </Tabs.Root>
      <Flex gap="3" mt="1" justify="end">
        <Dialog.Close>
          <Button variant="soft" color="gray">
            Close
          </Button>
        </Dialog.Close>
      </Flex>
    </Dialog.Content>
  )
}
