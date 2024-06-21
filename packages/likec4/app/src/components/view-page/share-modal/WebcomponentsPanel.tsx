import type { DiagramView } from '@likec4/core'
import { ActionIcon, Box, Code, CopyButton, Group, Stack, Text } from '@mantine/core'
import { IconExternalLink } from '@tabler/icons-react'
import { useRouter } from '@tanstack/react-router'
import { ComponentName } from '../../../const'
import { AlertLocalhost } from './AlertLocalhost'
import { CopyButtonChild } from './CopyButtonChild'

export function WebcomponentsPanel({ diagram }: { diagram: DiagramView }) {
  const router = useRouter()

  let base = router.basepath.endsWith('/') ? router.basepath : `${router.basepath}/`
  const url = new URL(
    `${base}likec4-views.js`,
    window.location.href
  )
  const href = url.href

  const jscode = `
  <script module src="${href}"></script>
`.trim()

  const htmlCode = `
  <${ComponentName.View} view-id="${encodeURIComponent(diagram.id)}"></${ComponentName.View}>
`.trim()

  const webcomponentPreview = router.buildLocation(
    import.meta.env.DEV
      ? {
        to: '/webcomponent/$',
        params: { _splat: '/' },
        hash: diagram.id,
        search: true
      }
      : {
        to: '/webcomponent/$',
        params: { _splat: diagram.id },
        search: true
      }
  )

  return (
    <Stack>
      {jscode.includes('http://localhost') && <AlertLocalhost />}
      <Box>
        <Text size="sm">
          Add this script to your page:
        </Text>
      </Box>
      <Stack gap={'xs'}>
        <Group justify="space-between">
          <Box>
            <Text fw={'500'} size="sm">JavaScript</Text>
          </Box>
          <Group gap={'xs'}>
            <ActionIcon component="a" href={webcomponentPreview.href} target="_blank" variant="light" color="gray">
              <IconExternalLink />
            </ActionIcon>
            <CopyButton
              value={jscode}
              timeout={1500}
              children={CopyButtonChild} />
          </Group>
        </Group>
        <Code block>
          {jscode}
        </Code>
        <Box>
          <Text size="sm" c={'dimmed'}>
            This script defines a custom element (webcomponent) that renders your diagrams.<br />
            Script must be inserted once in the <code>&lt;head&gt;</code> or at the end of the <code>&lt;body&gt;</code>
            {' '}
            tag.
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
            Insert this code to your page. Page may have multiple <code>&lt;likec4-view&gt;</code>.
          </Text>
        </Box>
      </Stack>
    </Stack>
  )
}
