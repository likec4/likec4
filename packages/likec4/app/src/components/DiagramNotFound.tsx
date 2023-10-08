import { ExclamationTriangleIcon } from '@radix-ui/react-icons'
import { Box, Button, Card, Flex, Heading, IconButton, Text } from '@radix-ui/themes'
import { $pages } from '../router'

export const DiagramNotFound = () => {
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
            <Text as='div'>The diagram you are looking for does not exist.</Text>
            <Box>
              <Button variant='soft' color='amber' onClick={() => $pages.index.open()}>
                Home page
              </Button>
            </Box>
          </Flex>
        </Flex>
      </Card>
    </Flex>
  )
}
