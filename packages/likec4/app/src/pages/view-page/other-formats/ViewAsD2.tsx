import { Box, Code, Flex, ScrollArea } from '@radix-ui/themes'
import useSWR from 'swr'
import { d2Source } from 'virtual:likec4/d2-sources'
import { CopyToClipboard } from '../../../components'

type ViewAsDotProps = {
  viewId: string
}

const fetchFromKroki = async (d2: string) => {
  const res = await fetch('https://kroki.io/d2/svg', {
    method: 'POST',
    cache: 'force-cache',
    body: JSON.stringify({
      diagram_source: d2,
      // diagram_options: {
      //   theme: 'colorblind-clear'
      // },
      output_format: 'svg'
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  })
  return await res.text()
}

export default function ViewAsD2({ viewId }: ViewAsDotProps) {
  const src = d2Source(viewId)

  const { data: krokiSvg } = useSWR(src, fetchFromKroki, {
    keepPreviousData: true,
    revalidateIfStale: false
  })
  return (
    <Flex
      gap='2'
      shrink='1'
      grow='1'
      align={'stretch'}
      wrap={'nowrap'}
      style={{
        overflow: 'hidden'
      }}
    >
      <Box
        py={'2'}
        position={'relative'}
        style={{
          overflow: 'scroll'
        }}
      >
        <ScrollArea scrollbars='both'>
          <Box
            asChild
            display={'block'}
            p='2'
            style={{
              whiteSpace: 'pre',
              minHeight: '100%'
            }}
          >
            <Code variant='soft' autoFocus>
              {src}
            </Code>
          </Box>
        </ScrollArea>
        <CopyToClipboard text={src} />
      </Box>
      {krokiSvg && (
        <Box
          py={'2'}
          grow={'1'}
          shrink={'0'}
          style={{
            width: '50%',
            overflow: 'scroll'
          }}
        >
          <ScrollArea scrollbars='both'>
            <Box grow={'1'} asChild className={'svg-container'}>
              <div dangerouslySetInnerHTML={{ __html: krokiSvg }}></div>
            </Box>
          </ScrollArea>
        </Box>
      )}
    </Flex>
  )
}
