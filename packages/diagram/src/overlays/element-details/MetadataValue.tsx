import { css } from '@likec4/styles/css'
import { Box, Flex, ScrollAreaAutosize, Stack, Text, Tooltip, UnstyledButton } from '@mantine/core'
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react'
import { createContext, useContext, useEffect, useRef, useState } from 'react'

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
    <Tooltip label={isGloballyExpanded ? 'Collapse all metadata values' : 'Expand all metadata values'}>
      <UnstyledButton
        onClick={() => setGloballyExpanded(!isGloballyExpanded)}
        className={css({
          fontSize: 'xs',
          color: 'mantine.colors.primary[6]',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 'xxs',
          padding: 'xs',
          borderRadius: 'md',
          transition: 'all 150ms ease',
          _hover: {
            backgroundColor: 'mantine.colors.primary[0]',
            color: 'mantine.colors.primary[7]',
            _dark: {
              backgroundColor: 'mantine.colors.primary[9]',
              color: 'mantine.colors.primary[4]',
            },
          },
        })}
      >
        {isGloballyExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
        {isGloballyExpanded ? 'Collapse all' : 'Expand all'}
      </UnstyledButton>
    </Tooltip>
  )
}

interface MetadataValueProps {
  label: string
  value: string | string[]
}

// Helper component for truncated single-line display
function TruncatedValue({ value, isExpanded }: { value: string; isExpanded: boolean }) {
  const [isTruncated, setIsTruncated] = useState(false)
  const textRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (textRef.current) {
      setIsTruncated(textRef.current.scrollWidth > textRef.current.clientWidth)
    }
  }, [value])

  return (
    <Tooltip
      label={isTruncated && !isExpanded ? value : null}
      multiline
      w={300}
      withinPortal
    >
      <Text
        ref={textRef}
        component="div"
        className={css({
          fontSize: 'sm',
          padding: 'xs',
          userSelect: 'all',
          color: 'mantine.colors.text',
          lineHeight: 1.4,
          whiteSpace: isExpanded ? 'pre-wrap' : 'nowrap',
          overflow: isExpanded ? 'visible' : 'hidden',
          textOverflow: isExpanded ? 'unset' : 'ellipsis',
          wordBreak: isExpanded ? 'break-word' : 'normal',
          minWidth: 0, // Allow shrinking
          width: '100%', // Take full available width
        })}
      >
        {value}
      </Text>
    </Tooltip>
  )
}

// Enhanced multi-value display component with inline display when collapsed
function MultiValueDisplay({
  values,
  isExpanded,
  onToggle,
}: {
  values: string[]
  isExpanded: boolean
  onToggle: () => void
}) {
  if (isExpanded) {
    // Expanded: Show each value in its own bordered container
    return (
      <Stack gap="xs">
        {values.map((value, index) => (
          <Box
            key={index}
            className={css({
              borderRadius: 'sm',
              border: '1px solid',
              borderColor: 'mantine.colors.gray[3]',
              backgroundColor: 'mantine.colors.white',
              transition: 'all 150ms ease',
              _dark: {
                borderColor: 'mantine.colors.dark[4]',
                backgroundColor: 'mantine.colors.dark[9]',
              },
              _hover: {
                borderColor: 'mantine.colors.gray[4]',
                backgroundColor: 'mantine.colors.gray[1]',
                _dark: {
                  backgroundColor: 'mantine.colors.dark[7]',
                  borderColor: 'mantine.colors.dark[3]',
                },
              },
            })}
          >
            <TruncatedValue value={value} isExpanded={true} />
          </Box>
        ))}
      </Stack>
    )
  }

  // Collapsed: Show all values inline with visual separators to distinguish elements
  return (
    <Box
      className={css({
        minHeight: '32px',
        display: 'flex',
        alignItems: 'center',
        padding: 'xs',
        gap: 'xs',
        flexWrap: 'wrap',
        minWidth: 0, // Allow shrinking
        overflow: 'hidden', // Prevent overflow
      })}
    >
      {values.map((value, index) => (
        <Flex key={index} align="center" gap="xs" style={{ minWidth: 0 }}>
          <Text
            className={css({
              fontSize: 'sm',
              padding: '[4px 8px]',
              backgroundColor: 'mantine.colors.white',
              color: 'mantine.colors.text',
              borderRadius: 'sm',
              border: '1px solid',
              borderColor: 'mantine.colors.gray[3]',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 'min(200px, 100%)', // Responsive max width
              minWidth: '60px', // Minimum readable width
              flex: '0 1 auto', // Allow shrinking
              userSelect: 'all',
              _dark: {
                backgroundColor: 'mantine.colors.dark[9]',
                color: 'mantine.colors.text',
                borderColor: 'mantine.colors.dark[4]',
              },
            })}
            title={value} // Tooltip for full value on hover
          >
            {value}
          </Text>
          {index < values.length - 1 && (
            <Text
              className={css({
                fontSize: 'xs',
                color: 'mantine.colors.gray[5]',
                fontWeight: 500,
                flexShrink: 0, // Don't shrink the separator
                _dark: {
                  color: 'mantine.colors.dark[3]',
                },
              })}
            >
              •
            </Text>
          )}
        </Flex>
      ))}
    </Box>
  )
}

/**
 * Enhanced Metadata Value Component
 *
 * Features:
 * - Works within metadata sub-grid (2-column: min-content 1fr)
 * - Left-aligned key labels within the metadata section
 * - Key labels themselves are clickable expand/collapse buttons for multi-value entries
 * - Labels never truncate (whiteSpace: nowrap) to ensure full visibility
 * - Alphabetical ordering of metadata keys for consistent display
 * - Collapsed state shows each value as distinct visual badges with bullet separators
 * - Expanded state shows each value in separate bordered containers
 * - Responsive text truncation with ellipsis and tooltips for values
 * - Global expand/collapse all functionality with smart individual override
 * - Individual buttons work independently when global is off, or override global when clicked
 * - Remembers expand state in localStorage
 * - Support for both single values and arrays
 * - Automatic line splitting for multiline strings
 *
 * Example usage:
 * ```tsx
 * <MetadataProvider>
 *   <MetadataValue label="version" value="1.2.3" />
 *   <MetadataValue label="environments" value={["dev", "staging", "prod"]} />
 *   <MetadataValue label="config" value={`line1\nline2\nline3`} />
 * </MetadataProvider>
 * ```
 */
export function MetadataValue({ label, value }: MetadataValueProps) {
  // Handle both string and string[] types consistently
  const elements = Array.isArray(value)
    ? value
    : typeof value === 'string' && value.includes('\n')
    ? value.split('\n').map(s => s.trim()).filter(Boolean)
    : [value]

  const hasMultipleElements = elements.length > 1
  const [isLocallyExpanded, setIsLocallyExpanded] = useState(false)
  const context = useContext(MetadataExpandContext)

  // Global state overrides local state when set, otherwise use local state
  const isExpanded = context?.isGloballyExpanded || isLocallyExpanded

  const handleToggle = () => {
    // If global expand is active, first turn it off, then set local state
    if (context?.isGloballyExpanded) {
      context.setGloballyExpanded(false)
      setIsLocallyExpanded(true) // Keep this item expanded
    } else {
      // Toggle local state when global is not active
      setIsLocallyExpanded(!isLocallyExpanded)
    }
  }

  return (
    <>
      {/* Left-aligned Key Label within metadata sub-grid */}
      {hasMultipleElements
        ? (
          <UnstyledButton
            onClick={handleToggle}
            className={css({
              fontSize: 'xs',
              color: 'mantine.colors.dimmed',
              justifySelf: 'end',
              textAlign: 'right',
              userSelect: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 'xs',
              padding: '[4px 8px]',
              borderRadius: 'sm',
              whiteSpace: 'nowrap', // Never cut off
              transition: 'all 150ms ease',
              _hover: {
                backgroundColor: 'mantine.colors.gray[1]',
                color: 'mantine.colors.primary[6]',
                _dark: {
                  backgroundColor: 'mantine.colors.dark[7]',
                  color: 'mantine.colors.primary[4]',
                },
              },
            })}
          >
            <Flex align="center" gap="xs">
              <Text component="span" size="xs" fw={700}>
                {label}:
              </Text>
              <Text
                component="span"
                className={css({
                  fontSize: 'xs',
                  fontWeight: 500,
                  color: 'mantine.colors.gray[6]',
                  backgroundColor: 'mantine.colors.gray[1]',
                  padding: '[1px 4px]',
                  borderRadius: 'xs',
                  _dark: {
                    color: 'mantine.colors.dark[2]',
                    backgroundColor: 'mantine.colors.dark[6]',
                  },
                })}
              >
                {elements.length}
              </Text>
              {isExpanded ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
            </Flex>
          </UnstyledButton>
        )
        : (
          <Text
            component="div"
            className={css({
              fontSize: 'xs',
              color: 'mantine.colors.dimmed',
              justifySelf: 'end',
              textAlign: 'right',
              userSelect: 'none',
              whiteSpace: 'nowrap', // Never cut off
              padding: '[4px 8px]',
              fontWeight: 700, // Make label bold
            })}
          >
            {label}:
          </Text>
        )}

      {/* Value Display */}
      <Box
        className={css({
          justifySelf: 'stretch', // Take full width of the value column
          alignSelf: 'start', // Align to the start of the grid cell
        })}
      >
        {hasMultipleElements
          ? (
            <MultiValueDisplay
              values={elements}
              isExpanded={isExpanded}
              onToggle={handleToggle}
            />
          )
          : (
            <Box
              className={css({
                minHeight: '32px',
                display: 'flex',
                alignItems: 'center',
              })}
            >
              <TruncatedValue value={elements[0]} isExpanded={isExpanded} />
            </Box>
          )}
      </Box>
    </>
  )
}
