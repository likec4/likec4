import {
  Box,
  DropdownMenu,
  Select,
  Flex,
  IconButton,
  Card,
  Text,
  Avatar,
  Heading,
  Button,
  ScrollArea
} from '@radix-ui/themes'
import styles from './Navigation.module.css'
import { useToggle } from '@react-hookz/web/esm'

import { HamburgerMenuIcon } from '@radix-ui/react-icons'
import { useCurrentView } from '../likec4'
import { useDiagramsList } from './data'
import { $pages } from '../router'
const Navigation = () => {
  const [isOpened, toggle] = useToggle(false, true)
  const diagrams = useDiagramsList()
  const diagram = useCurrentView()
  return (
    <Flex position={'fixed'} top={'0'} left={'0'} bottom={'0'} direction={'row'}>
      <Flex
        direction={'column'}
        className={styles.navigation}
        width={'min-content'}
        onClick={toggle}
        data-opened={isOpened}
      >
        <Box grow={'0'} py={'4'} px={'4'} hidden={isOpened}>
          <IconButton size='4' variant='ghost'>
            <HamburgerMenuIcon width='22' height='22' />
          </IconButton>
        </Box>
        <Box
          grow={'1'}
          hidden={!isOpened}
          style={{
            overflow: 'hidden'
          }}
        >
          <ScrollArea scrollbars='vertical'>
            <Flex direction='column' gap='3' py={'4'}>
              {diagrams.map(diagram => (
                <Button key={diagram.id} size={'3'} variant={'ghost'} onClick={() => $pages.view.open(diagram.id)}>
                  {diagram.title}
                </Button>
              ))}
            </Flex>
          </ScrollArea>
        </Box>
      </Flex>
      <Box p={'3'}>
        <Heading size={'6'}>{diagram?.title}</Heading>
      </Box>
    </Flex>
  )
}

export default Navigation
