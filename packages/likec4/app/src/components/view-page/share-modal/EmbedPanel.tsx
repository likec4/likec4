import {
  ActionIcon,
  Box,
  Code,
  CopyButton,
  Group,
  type MantineColorScheme,
  Select,
  Stack,
  Text,
  useMantineColorScheme
} from '@mantine/core'
import { IconExternalLink } from '@tabler/icons-react'
import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import type { DiagramView } from 'virtual:likec4/views'
import { AlertLocalhost } from './AlertLocalhost'
import { CopyButtonChild } from './CopyButtonChild'

export const EmbedPanel = ({ diagram }: { diagram: DiagramView }) => {
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
  const width = diagram.bounds.width + padding * 2
  const height = diagram.bounds.height + padding * 2
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
            <Text fw={'500'} size="sm">HTML</Text>
          </Box>
          <Group gap={'xs'}>
            <ActionIcon component="a" href={href} target="_blank" variant="light" color="gray">
              <IconExternalLink />
            </ActionIcon>
            <CopyButton value={code} timeout={1500} children={CopyButtonChild} />
          </Group>
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
            ]} />
        </Box>
      </Stack>
    </Stack>
  )
}
