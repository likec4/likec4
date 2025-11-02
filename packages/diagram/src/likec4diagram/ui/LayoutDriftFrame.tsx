import { css } from '@likec4/styles/css'
import { Box, HStack } from '@likec4/styles/jsx'
import {
  UnstyledButton,
} from '@mantine/core'
import { memo } from 'react'
import { useDiagramCompareLayout } from '../../hooks/useDiagramCompareLayout'

export const LayoutDriftFrame = memo(() => {
  const [{ layout, isActive }, { switchLayout }] = useDiagramCompareLayout()

  if (!isActive) return null

  const bgColor = layout === 'manual' ? 'var(--mantine-color-orange-6)' : 'var(--mantine-color-green-6)'

  return (
    <Box
      css={{
        position: 'absolute',
        top: '0',
        left: '0',
        width: 'full',
        height: 'full',
        border: `default`,
        borderWidth: 3,
        pointerEvents: 'none',
      }}
      style={{
        borderColor: bgColor,
      }}
    >
      <HStack
        css={{
          position: 'absolute',
          alignItems: 'stretch',
          top: '0',
          gap: '0.5',
          py: '0',
          px: '4',
          pointerEvents: 'all',
          color: 'mantine.colors.gray[9]',
          userSelect: 'none',
          overflow: 'hidden',
        }}
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      >
        <Btn
          {...layout === 'manual' ? { 'data-selected': true } : {}}
          bg={'orange.6'}
          onClick={() => {
            switchLayout('manual')
          }}>
          saved version
        </Btn>
        <Btn
          {...layout === 'auto' ? { 'data-selected': true } : {}}
          bg={'green.6'}
          onClick={() => {
            switchLayout('auto')
          }}>
          latest
        </Btn>
      </HStack>
    </Box>
  )
})

const Btn = UnstyledButton.withProps({
  className: css({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '1',
    fontSize: 'xs',
    transformOrigin: 'center top',
    transition: 'fast',
    transform: {
      base: 'translateY(-3px)',
      _hover: 'translateY(-1px)',
      _selected: 'translateY(0)!',
    },
    fontWeight: {
      base: 'medium',
      // _selected: '500',
    },
    py: '1',
    lineHeight: '1',
    borderBottomLeftRadius: 'sm',
    borderBottomRightRadius: 'sm',
    px: '4',
  }),
})
