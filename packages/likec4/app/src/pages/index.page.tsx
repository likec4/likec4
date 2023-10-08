import { DashboardIcon } from '@radix-ui/react-icons'
import { Box, Button, Card, Flex, Separator, Text } from '@radix-ui/themes'
import type { Atom } from 'jotai'
import { useAtomValue } from 'jotai'
import { memo } from 'react'
import type { IndexPageTile as IDashboardTile } from '../data'
import { useIndexPageTileAtoms } from '../data'
import { $pages } from '../router'
import styles from './index.module.css'

type DashboardTileViewAtom = IDashboardTile['views'][number]
const DashboardTileView = ({ atom }: { atom: DashboardTileViewAtom }) => {
  const { title, id } = useAtomValue(atom)
  return (
    <Flex asChild justify={'start'}>
      <Button
        color='gray'
        variant='soft'
        className='cursor-pointer'
        size='2'
        onClick={_ => $pages.view.open(id)}
      >
        <DashboardIcon
          width={14}
          height={14}
          style={{
            color: 'var(--gray-a10)'
          }}
        />
        <Text>{title}</Text>
      </Button>
    </Flex>
  )
}

const DashboardTile = ({ atom }: { atom: Atom<IDashboardTile> }) => {
  const { path, views, isRoot } = useAtomValue(atom)
  return (
    <Card
      asChild
      className={styles.dashboardTile}
      variant='classic'
      size={{
        initial: '1',
        sm: '2'
      }}
    >
      <Box grow={'1'} shrink={'0'}>
        <Flex direction='column' gap='3'>
          <Text
            as='div'
            trim='end'
            weight={isRoot ? 'medium' : 'bold'}
            size='2'
            className='truncate'
            color={isRoot ? 'gray' : undefined}
          >
            {isRoot ? 'index' : '🗂️ ' + path}
          </Text>
          <Separator orientation='horizontal' my='1' size={'4'} />
          {views.map(view => (
            <DashboardTileView key={view.toString()} atom={view} />
          ))}
        </Flex>
      </Box>
    </Card>
  )
}

export const IndexPage = memo(() => {
  const tiles = useIndexPageTileAtoms()
  return (
    <Box
      style={{
        paddingLeft: 60
      }}
    >
      <Flex
        gap={{
          initial: '4',
          lg: '6'
        }}
        p={{
          initial: '4',
          lg: '6'
        }}
        wrap={{
          initial: 'nowrap',
          sm: 'wrap'
        }}
        direction={{
          initial: 'column',
          sm: 'row'
        }}
        align='stretch'
      >
        {tiles.map(tile => (
          <DashboardTile key={tile.toString()} atom={tile} />
        ))}
      </Flex>
    </Box>
  )
})
