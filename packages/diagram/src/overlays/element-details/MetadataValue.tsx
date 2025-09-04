import { css } from '@likec4/styles/css'
import { Box, ScrollAreaAutosize, Stack, Text, UnstyledButton } from '@mantine/core'
import { createContext, useContext, useState } from 'react'

// Global context for expand/collapse all state
const MetadataExpandContext = createContext<
  {
    isGloballyExpanded: boolean
    setGloballyExpanded: (expanded: boolean) => void
  } | null
>(null)

export function MetadataProvider({ children }: { children: React.ReactNode }) {
  const [isGloballyExpanded, setIsGloballyExpanded] = useState(() => {
    // Remember preference from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('metadata-expanded')
      return saved ? JSON.parse(saved) : false
    }
    return false
  })

  const setGloballyExpanded = (expanded: boolean) => {
    setIsGloballyExpanded(expanded)
    if (typeof window !== 'undefined') {
      localStorage.setItem('metadata-expanded', JSON.stringify(expanded))
    }
  }

  return (
    <MetadataExpandContext.Provider value={{ isGloballyExpanded, setGloballyExpanded }}>
      {children}
    </MetadataExpandContext.Provider>
  )
}

export function MetadataExpandAllButton() {
  const context = useContext(MetadataExpandContext)
  if (!context) return null

  const { isGloballyExpanded, setGloballyExpanded } = context

  return (
    <UnstyledButton
      onClick={() => setGloballyExpanded(!isGloballyExpanded)}
      className={css({
        fontSize: 'xs',
        color: 'mantine.colors.primary',
        textAlign: 'left',
        padding: 'xs',
        borderRadius: 'sm',
        _hover: {
          backgroundColor: 'mantine.colors.gray[1]',
          _dark: {
            backgroundColor: 'mantine.colors.dark[7]',
          },
        },
      })}
    >
      {isGloballyExpanded ? 'Collapse all' : 'Expand all'}
    </UnstyledButton>
  )
}

interface MetadataValueProps {
  label: string
  value: string | string[]
}

export function MetadataValue({ label, value }: MetadataValueProps) {
  // Handle both string and string[] types consistently
  const elements = Array.isArray(value)
    ? value
    : typeof value === 'string' && value.includes('\n')
    ? value.split('\n').map(s => s.trim()).filter(Boolean)
    : [value]

  const hasMultipleElements = elements.length > 1
  const [isExpanded, setIsExpanded] = useState(false)
  const context = useContext(MetadataExpandContext)

  // Use global expand state if available, otherwise use local state
  const shouldExpand = context?.isGloballyExpanded || isExpanded
  const displayElements = hasMultipleElements && !shouldExpand ? [elements[0]] : elements

  return (
    <Box
      className={css({
        display: 'grid',
        gridTemplateColumns: 'min-content 1fr',
        gap: 'sm',
        alignItems: 'flex-start',
      })}
    >
      {/* Key - Bold styling as required */}
      <Text
        component="div"
        className={css({
          fontSize: 'sm',
          fontWeight: 'bold', // Bold as required
          whiteSpace: 'nowrap',
          color: 'mantine.colors.defaultColor',
          paddingTop: 'xs', // Align with content
        })}
      >
        {label}:
      </Text>

      {/* Value(s) - Border view for all items */}
      <Stack gap="xs">
        {displayElements.map((element, index) => (
          <ScrollAreaAutosize
            key={index}
            type="auto"
            mah={200}
            overscrollBehavior="none"
            className={css({
              transitionProperty: 'all',
              transitionDuration: 'fast',
              transitionTimingFunction: 'inOut',
              borderRadius: 'sm',
              border: '1px solid',
              borderColor: 'mantine.colors.defaultBorder',
              backgroundColor: 'mantine.colors.body',
              _dark: {
                borderColor: 'mantine.colors.dark[4]',
                backgroundColor: 'mantine.colors.dark[8]',
              },
              _hover: {
                transitionTimingFunction: 'out',
                backgroundColor: 'mantine.colors.defaultHover',
                borderColor: 'mantine.colors.gray[6]',
                _dark: {
                  backgroundColor: 'mantine.colors.dark[7]',
                  borderColor: 'mantine.colors.dark[3]',
                },
              },
            })}
          >
            <Text
              component="div"
              className={css({
                fontSize: 'sm',
                padding: 'xs',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                userSelect: 'all',
                color: 'mantine.colors.text',
                lineHeight: 1.4,
              })}
            >
              {element}
            </Text>
          </ScrollAreaAutosize>
        ))}

        {/* Show expand/collapse button when there are multiple elements */}
        {hasMultipleElements && (
          <UnstyledButton
            onClick={() => setIsExpanded(!isExpanded)}
            className={css({
              fontSize: 'xs',
              color: 'mantine.colors.primary',
              textAlign: 'left',
              padding: 'xs',
              borderRadius: 'sm',
              _hover: {
                backgroundColor: 'mantine.colors.gray[1]',
                _dark: {
                  backgroundColor: 'mantine.colors.dark[7]',
                },
              },
            })}
          >
            {shouldExpand
              ? `Show less (${elements.length - 1} hidden)`
              : `Show all (${elements.length - 1} more)`}
          </UnstyledButton>
        )}
      </Stack>
    </Box>
  )
}
