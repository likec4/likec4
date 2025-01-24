import type { Link } from '@likec4/core'
import { Anchor, Box, Button, CopyButton, Group } from '@mantine/core'

export function Link({ link }: { link: Link }) {
  return (
    <>
      <Group key={link.url} wrap="nowrap" align="center" gap={'sm'}>
        <Box flex={'1'} style={{ overflow: 'hidden' }}>
          <Anchor
            href={link.url}
            target="_blank"
            fz="xs"
            truncate="end"
            display={'inline-block'}
            w={'100%'}
            onClick={(e) => e.stopPropagation()}>
            {link.title || link.url}
          </Anchor>
        </Box>
        <CopyButton value={link.url}>
          {({ copied, copy }) => (
            <Button
              size="compact-xs"
              fz={'10'}
              variant="light"
              onClick={(e) => {
                e.stopPropagation()
                copy()
              }}
              color={copied
                ? 'teal'
                : 'gray'}>
              {copied ? 'copied' : 'copy'}
            </Button>
          )}
        </CopyButton>
      </Group>
    </>
  )
}
