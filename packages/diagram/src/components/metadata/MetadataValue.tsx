import { css, cx } from '@likec4/styles/css'
import { Box, Flex, Stack, Text, Tooltip, UnstyledButton } from '@mantine/core'
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react'
import { createContext, useContext, type ReactNode, useEffect, useRef, useState } from 'react'

export type MetadataVariant = 'inline' | 'tooltip'

const MetadataContext = createContext<MetadataVariant>('inline')

export function MetadataProvider({
  children,
  variant = 'inline',
}: {
  children: ReactNode
  variant?: MetadataVariant
}) {
  return (
    <MetadataContext.Provider value={variant}>
      {children}
    </MetadataContext.Provider>
  )
}

const useVariant = (variant?: MetadataVariant) => variant ?? useContext(MetadataContext)

interface MetadataValueProps {
  label: string
  value: string | string[]
  layout?: 'grid' | 'stack'
  variant?: MetadataVariant
}

function TruncatedValue({
  value,
  isExpanded,
  variant,
}: {
  value: string
  isExpanded: boolean
  variant: MetadataVariant
}) {
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
          fontSize: variant === 'tooltip' ? 'xs' : 'sm',
          padding: variant === 'tooltip' ? '0' : 'xs',
          userSelect: 'all',
          color: 'mantine.colors.text',
          lineHeight: 1.4,
          whiteSpace: isExpanded ? 'pre-wrap' : 'nowrap',
          overflow: isExpanded ? 'visible' : 'hidden',
          textOverflow: isExpanded ? 'unset' : 'ellipsis',
          wordBreak: isExpanded ? 'break-word' : 'normal',
          minWidth: 0,
          width: '100%',
        })}
      >
        {value}
      </Text>
    </Tooltip>
  )
}

function MultiValueDisplay({
  values,
  isExpanded,
  variant,
}: {
  values: string[]
  isExpanded: boolean
  variant: MetadataVariant
}) {
  if (isExpanded) {
    return (
      <Stack gap="xs">
        {values.map((value, index) => (
          <Flex key={index} align="center" gap="xs">
            <Text
              className={css({
                fontSize: 'xs',
                color: 'mantine.colors.gray[5]',
                fontWeight: 500,
                flexShrink: 0,
                _dark: {
                  color: 'mantine.colors.dark[3]',
                },
              })}
            >
              •
            </Text>
            <Box
              className={css({
                minHeight: variant === 'tooltip' ? '0' : '32px',
                display: 'flex',
                alignItems: 'center',
                flex: 1,
              })}
            >
              <TruncatedValue value={value} isExpanded={true} variant={variant} />
            </Box>
          </Flex>
        ))}
      </Stack>
    )
  }

  return (
    <Box
      className={css({
        minHeight: variant === 'tooltip' ? '0' : '32px',
        display: 'flex',
        alignItems: variant === 'tooltip' ? 'start' : 'center',
        padding: variant === 'tooltip' ? '0' : 'xs',
        gap: 'xs',
        flexDirection: variant === 'tooltip' ? 'column' : 'row',
        flexWrap: variant === 'tooltip' ? 'nowrap' : 'wrap',
        minWidth: 0, // Allow shrinking
        overflow: 'hidden', // Prevent overflow
      })}
    >
      {values.map((value, index) => (
        <Flex
          key={index}
          align={variant === 'tooltip' ? 'flex-start' : 'center'}
          gap="xs"
          style={{ minWidth: 0 }}
        >
          <Text
            className={css({
              fontSize: variant === 'tooltip' ? 'xs' : 'sm',
              padding: variant === 'tooltip' ? '0' : '[4px 8px]',
              backgroundColor: variant === 'tooltip' ? 'transparent' : 'mantine.colors.white',
              color: 'mantine.colors.text',
              borderRadius: variant === 'tooltip' ? '0' : 'sm',
              border: variant === 'tooltip' ? 'none' : '1px solid',
              borderColor: variant === 'tooltip' ? 'transparent' : 'mantine.colors.gray[3]',
              whiteSpace: variant === 'tooltip' ? 'normal' : 'nowrap',
              overflow: variant === 'tooltip' ? 'visible' : 'hidden',
              textOverflow: variant === 'tooltip' ? 'unset' : 'ellipsis',
              maxWidth: 'min(260px, 100%)',
              minWidth: variant === 'tooltip' ? '0' : '60px',
              flex: '0 1 auto',
              userSelect: 'all',
              _dark: {
                backgroundColor: variant === 'tooltip' ? 'transparent' : 'mantine.colors.dark[9]',
                color: 'mantine.colors.text',
                borderColor: variant === 'tooltip' ? 'transparent' : 'mantine.colors.dark[4]',
              },
            })}
            title={value}
          >
            {value}
          </Text>
          {index < values.length - 1 && (
            <Text
              className={css({
                fontSize: 'xs',
                color: 'mantine.colors.gray[5]',
                fontWeight: 500,
                flexShrink: 0,
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

export function MetadataValue({ label, value, layout, variant: propVariant }: MetadataValueProps) {
  const variant = useVariant(propVariant)
  const resolvedLayout = layout ?? (variant === 'tooltip' ? 'stack' : 'grid')
  const elements = Array.isArray(value)
    ? value
    : typeof value === 'string' && value.includes('\n')
    ? value.split('\n').map(s => s.trim()).filter(Boolean)
    : [value]

  const hasMultipleElements = elements.length > 1
  const [isExpanded, setIsExpanded] = useState(false)

  const handleToggle = () => {
    setIsExpanded(!isExpanded)
  }

  const labelMarkup = hasMultipleElements
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
          whiteSpace: 'nowrap',
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
          whiteSpace: 'nowrap',
          padding: '[4px 8px]',
          fontWeight: 700,
        })}
      >
        {label}:
      </Text>
    )

  if (resolvedLayout === 'stack') {
    return (
      <Stack gap="4px" align="stretch" className={cx(css({ width: '100%' }))}>
        <Text
          component="div"
          className={css({
            fontSize: 'xxs',
            fontWeight: 700,
            color: 'mantine.colors.gray[6]',
            letterSpacing: '0.4px',
            textTransform: 'uppercase',
          })}
        >
          {label}
        </Text>
        {hasMultipleElements
          ? (
            <MultiValueDisplay
              values={elements}
              isExpanded={isExpanded}
              variant={variant}
            />
          )
          : (
            <Box
              className={css({
                minHeight: '0',
                display: 'flex',
                alignItems: 'center',
              })}
            >
              <TruncatedValue value={elements[0] || ''} isExpanded={isExpanded} variant={variant} />
            </Box>
          )}
      </Stack>
    )
  }

  return (
    <>
      {labelMarkup}
      <Box
        className={css({
          justifySelf: 'stretch',
          alignSelf: 'start',
        })}
      >
        {hasMultipleElements
          ? (
            <MultiValueDisplay
              values={elements}
              isExpanded={isExpanded}
              variant={variant}
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
              <TruncatedValue value={elements[0] || ''} isExpanded={isExpanded} variant={variant} />
            </Box>
          )}
      </Box>
    </>
  )
}
