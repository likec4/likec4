import { MoonIcon } from '@radix-ui/react-icons'
import { IconButton, ThemePanel } from '@radix-ui/themes'
import { useToggle } from '@react-hookz/web'

export const ThemePanelToggle = import.meta.env.PROD
  ? () => null
  : () => {
      const [isOpened, toggle] = useToggle(false, true)

      return (
        <>
          <IconButton
            color='gray'
            variant={isOpened ? 'solid' : 'soft'}
            onClick={toggle}
            size={'2'}
          >
            <MoonIcon width={16} height={16} />
          </IconButton>
          {isOpened && <ThemePanel style={{ top: 50 }} />}
        </>
      )
    }
