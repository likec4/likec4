import { css, cx } from '@likec4/styles/css'
import { Box } from '@likec4/styles/jsx'
import { hstack } from '@likec4/styles/patterns'
import {
  UnstyledButton,
} from '@mantine/core'

const borderColors = {
  manual: css({
    borderColor: 'likec4.compare.manual',
  }),
  auto: css({
    borderColor: 'likec4.compare.latest',
  }),
} as const

const bgColors = {
  manual: css({
    backgroundColor: 'likec4.compare.manual',
  }),
  auto: css({
    backgroundColor: 'likec4.compare.latest',
  }),
} as const

export const LayoutDriftFrame = ({ layout, onClose }: {
  layout: 'manual' | 'auto'
  onClose: () => void
}) => {
  return (
    <Box
      className={cx(
        hstack({
          position: 'absolute',
          top: '0',
          left: '0',
          width: 'full',
          height: 'full',
          border: `default`,
          borderWidth: '4',
          pointerEvents: 'none',
          alignItems: 'flex-start',
          justifyContent: 'center',
        }),
        borderColors[layout],
      )}
      style={{
        zIndex: '9999',
      }}
    >
      <Btn
        className={bgColors[layout]}
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}>
        Close compare
      </Btn>
    </Box>
  )
}

const Btn = UnstyledButton.withProps({
  classNames: {
    root: css({
      fontSize: 'xs',
      fontWeight: 'medium',
      py: '1.5',
      lineHeight: '1',
      borderBottomLeftRadius: 'sm',
      borderBottomRightRadius: 'sm',
      transform: 'translateY(-4px)',
      px: '4',
      color: 'mantine.gray[9]',
      pointerEvents: 'all',
      transition: '[transform 100ms ease-out]',
      _active: {
        transform: 'translateY(-3px)',
      },
    }),
  },
})
