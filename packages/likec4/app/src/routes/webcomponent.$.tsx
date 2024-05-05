import { Box, Flex, useMantineColorScheme } from '@mantine/core'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { ComponentName } from '../const'
import { cssWebcomponentIframeContainer, cssWebcomponentView } from './view.css'

export const Route = createFileRoute('/webcomponent/$')({
  component: WebcomponentPage
})

function WebcomponentPage() {
  const router = useRouter()
  const viewId = Route.useParams()._splat || 'index'
  const { colorScheme } = useMantineColorScheme()

  let base = router.basepath.endsWith('/') ? router.basepath : `${router.basepath}/`
  const jsurl = new URL(
    `${base}likec4-views.js`,
    window.location.href
  )

  const iframeHtml = `
    <!DOCTYPE html>
    <html lang="en-US" style="color-scheme: ${colorScheme};">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no" />
      <style>
        * {
          border-width: 0px;
          border-style: solid;
          box-sizing: border-box;
          overflow-wrap: break-word;
        }
        html, body {
          margin: 0;
          background-color: transparent !important;
          width: 100%;
          height: 100%;
          font-size: 16px;
        }
        body {
          position: relative;
          min-height: 100%;
          padding: clamp(0.5rem, 5vh, 4rem) clamp(0.5rem, 5vw, 5rem);
        }
      </style>
    </head>
    <body>
      <script type="module" src="${jsurl.href}"></script>
      <${ComponentName.View} view-id="${encodeURIComponent(viewId)}"></${ComponentName.View}>
    </body>
    </html>
  `
  return (
    <Flex direction={'column'} className={cssWebcomponentView}>
      {
        /* <Group>
        <Text size="xl">Webcomponent</Text>
      </Group> */
      }
      <Box className={cssWebcomponentIframeContainer}>
        <iframe
          srcDoc={iframeHtml}
          // @ts-expect-error allowtransparency is not in the iframe element type
          allowtransparency={'true'}>
        </iframe>
      </Box>
    </Flex>
  )
}
