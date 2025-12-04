import { css } from '@likec4/styles/css'
import { Box, Divider, Stack, Text } from '@mantine/core'
import type { Element } from '@likec4/core/types'
import type { ReactNode } from 'react'
import { MetadataProvider, MetadataValue, type MetadataVariant } from './MetadataValue'

export type MetadataEntries = Array<[string, string | string[]]>

interface MetadataSectionProps {
  entries: MetadataEntries
  variant?: MetadataVariant
  /** Inline label (used in property grids). */
  label?: ReactNode
  /** Optional title for tooltip layout. */
  title?: ReactNode
}

const DEFAULT_INLINE_LABEL = (
  <Text
    component="div"
    fz="xs"
    c="dimmed"
    style={{ justifySelf: 'end', textAlign: 'right' }}
  >
    metadata
  </Text>
)

export function MetadataSection({
  entries,
  variant = 'inline',
  label = DEFAULT_INLINE_LABEL,
  title = 'Metadata',
}: MetadataSectionProps) {
  if (!entries.length) {
    return null
  }

  const layout = variant === 'tooltip' ? 'stack' : 'grid'

  if (variant === 'tooltip') {
    return (
      <MetadataProvider variant="tooltip">
        <Stack gap="xs" p="xs">
          {title && (
            <Text
              component="div"
              fw={700}
              fz={10}
              c="dimmed"
              tt="uppercase"
              style={{ letterSpacing: '0.4px' }}
            >
              {title}
            </Text>
          )}
          <Divider w="60%" maw={160} color="gray.3" ml={0} my={4} />
          <Stack gap={8}>
            {entries.map(([key, value]) => (
              <MetadataValue key={key} label={key} value={value} layout={layout} />
            ))}
          </Stack>
        </Stack>
      </MetadataProvider>
    )
  }

  return (
    <MetadataProvider>
      <>
        {label}
        <Box
          className={css({
            display: 'grid',
            gridTemplateColumns: 'min-content 1fr',
            gridAutoRows: 'min-content',
            gap: `[12px 16px]`,
            alignItems: 'baseline',
            justifyItems: 'stretch',
          })}
        >
          {entries.map(([key, value]) => (
            <MetadataValue key={key} label={key} value={value} layout={layout} />
          ))}
        </Box>
      </>
    </MetadataProvider>
  )
}

export type MetadataValues = NonNullable<Element['metadata']>
