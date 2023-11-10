import { Box, Button, Flex, IconButton, ScrollArea, Separator } from '@radix-ui/themes'
import { useClickOutside, useToggle } from '@react-hookz/web/esm'

import { HamburgerMenuIcon, ArrowLeftIcon } from '@radix-ui/react-icons'
import { useRef } from 'react'
import { cn } from '../../utils'

import { DiagramsTree } from './DiagramsTree'
import styles from './styles.module.css'
import { $pages } from '../../router'

export const Sidebar = () => {
  const ref = useRef<HTMLDivElement>(null)
  const [isOpened, toggle] = useToggle(false, true)

  useClickOutside(ref, () => isOpened && toggle())

  return (
    <>
      <Flex
        position='fixed'
        left='0'
        p={'2'}
        className={cn(
          styles.trigger,
          'inset-y-0 cursor-pointer items-start',
          isOpened && 'display-none'
        )}
        onClick={toggle}
      >
        <IconButton size='2' color='gray' variant='soft'>
          <HamburgerMenuIcon width={22} height={22} />
        </IconButton>
      </Flex>
      <Flex
        ref={ref}
        className={styles.navsidebar}
        position='fixed'
        left='0'
        top='0'
        bottom='0'
        data-opened={isOpened}
      >
        <ScrollArea scrollbars='vertical' type='scroll'>
          <Box p='4' pl='2'>
            <Button
              variant='ghost'
              ml='2'
              mt='1'
              size='1'
              color='gray'
              onClick={_ => {
                toggle()
                $pages.index.open()
              }}
            >
              <ArrowLeftIcon />
              Back to overview
            </Button>
            <Separator orientation='horizontal' my='3' size={'4'} />
            <DiagramsTree />
          </Box>
        </ScrollArea>
      </Flex>
    </>
  )
}
