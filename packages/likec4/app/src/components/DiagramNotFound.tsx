import { ExclamationTriangleIcon } from '@radix-ui/react-icons'
import { Box, Button, Card, Code, Flex, Heading, IconButton, Text } from '@radix-ui/themes'
import { $pages } from '../router'

export const DiagramNotFound = ({ viewId }: { viewId: string }) => {
  return (
    <Flex position='fixed' inset='0' align='center' justify='center'>
      <Card color='red' size='3'>
        <Flex gap='4' direction='row' align='start'>
          <Box grow='0' shrink='0' pt='1'>
            <IconButton variant='ghost' color='amber'>
              <ExclamationTriangleIcon width={50} height={50} />
            </IconButton>
          </Box>
          <Flex gap='3' direction='column'>
            <Heading trim='both' color='amber' size='4'>
              Diagram not found
            </Heading>
            <Text as='div'>
              The diagram{' '}
              <Code color='amber' variant='soft'>
                {viewId}
              </Code>{' '}
              does not exist
            </Text>
            <Box pt='2'>
              <Button
                variant='soft'
                color='amber'
                className='cursor-pointer'
                onClick={() => $pages.index.open()}
              >
                Go to overview
              </Button>
            </Box>
          </Flex>
        </Flex>
      </Card>
    </Flex>
  )
}
