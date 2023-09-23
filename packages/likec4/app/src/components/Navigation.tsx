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
  Dialog,
  ScrollArea,
  TextField,
  Link
} from '@radix-ui/themes'
import styles from './Navigation.module.css'
import { useToggle, useClickOutside } from '@react-hookz/web/esm'

import { HamburgerMenuIcon } from '@radix-ui/react-icons'
import { useCurrentView } from '../likec4'
import { useDiagramsList } from './data'
import { $pages } from '../router'
import { useRef } from 'react'

const Navigation = () => {
  const ref = useRef<HTMLDivElement>(null)
  const [isOpened, toggle] = useToggle(false, true)
  const diagrams = useDiagramsList()
  const diagram = useCurrentView()

  useClickOutside(ref, () => {
    if (isOpened) {
      toggle()
    }
  })

  return null
  // return (
  //   <Flex position={'fixed'} top={'0'} left={'0'} bottom={'0'} direction={'row'} className='dark:bg-slate-800'>
  //     <Flex ref={ref} direction={'column'} className={styles.navigation} onClick={toggle} data-opened={isOpened}>
  //       <Box grow={'0'} py={'3'} px={'4'}>
  //         <IconButton size='3' variant='ghost'>
  //           <HamburgerMenuIcon width='22' height='22' />
  //         </IconButton>
  //       </Box>
  //       <div className='flex-auto flex space-x-2'>
  //         <button className='h-10 px-6 font-semibold rounded-4 bg-accent-11 text-b text-white' type='submit'>
  //           Buy now
  //         </button>
  //         <button className='h-10 px-6 font-semibold rounded-md bg-slate-10 border border-slate-200 text-slate-900' type='button'>
  //           Add to bag
  //         </button>
  //       </div>
  //       <Box
  //         grow={'1'}
  //         p={'1'}
  //         hidden={!isOpened}
  //         style={{
  //           overflow: 'hidden'
  //         }}
  //       >
  //         <ScrollArea scrollbars='vertical' type='scroll'>
  //           <Flex direction='column' gap='3' px={'4'} py={'2'}>
  //             {diagrams.map(diagram => (
  //               <Box
  //                 key={diagram.id}
  //                 onClick={e => {
  //                   e.stopPropagation()
  //                   $pages.view.open(diagram.id)
  //                 }}
  //               >
  //                 <Link size='2' weight='medium'>
  //                   {diagram.title}
  //                 </Link>
  //               </Box>
  //             ))}
  //           </Flex>
  //         </ScrollArea>
  //       </Box>
  //     </Flex>
  //     <Box p={'3'}>
  //       <Heading size={'6'}>{diagram?.title}</Heading>
  //     </Box>
  //   </Flex>
  // )
}

export default Navigation
