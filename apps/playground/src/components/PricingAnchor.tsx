import { hstack } from '@likec4/styles/patterns'
import { Anchor } from '@mantine/core'
import { IconExternalLink } from '@tabler/icons-react'

export const PricingAnchor = ({
  text = 'Help us to keep service running',
}: { text?: string }) => (
  <Anchor
    href={'https://github.com/sponsors/likec4'}
    target="_blank"
    underline="hover"
    className={hstack({
      display: 'inline-flex',
      gap: '[1px]',
      alignItems: 'center',
      fontSize: 'xs',
      whiteSpace: 'nowrap',
      '& .tabler-icon': {
        width: '12px',
        opacity: 0.75,
      },
      '&:hover .tabler-icon': {
        opacity: 1,
      },
    })}
  >
    <span>{text}</span>
    <IconExternalLink />
  </Anchor>
)
