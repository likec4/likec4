import { MoonIcon } from '@radix-ui/react-icons'
import { Box, IconButton, ThemePanel } from '@radix-ui/themes'
import { useToggle } from '@react-hookz/web/esm'

export const ThemeButton = () => {
  const [isOpened, toggle] = useToggle(false, true)
  return (
    <>
      <Box position='fixed' top='0' right='0' p='2'>
        <IconButton color='gray' variant={isOpened ? 'solid' : 'soft'} onClick={toggle} size={'2'}>
          <MoonIcon width={16} height={16} />
        </IconButton>
        {isOpened && <ThemePanel style={{ top: 50 }} />}
      </Box>
    </>
  )
}
