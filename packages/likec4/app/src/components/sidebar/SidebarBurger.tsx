import { Box } from '@likec4/styles/jsx'
import { Burger } from '@mantine/core'
import { SidebarDrawerOps } from './state'

export function SidebarBurger() {
  return (
    <Box
      css={{
        position: 'fixed',
        top: '[14px]',
        left: '[10px]',
      }}>
      <Burger
        size={'sm'}
        onClick={SidebarDrawerOps.open}
        aria-label="Toggle navigation" />
    </Box>
  )
}
