import type { Link as LinkData } from '@likec4/core'
import { css, cx } from '@likec4/styles/css'
import { type BadgeProps, ActionIcon, Badge, CopyButton } from '@mantine/core'
import { IconCheck, IconCopy } from '@tabler/icons-react'
import { forwardRef } from 'react'
import { GithubIcon } from './GithubIcon'

const GITHUB_PREFIX = 'https://github.com/'

export const Link = forwardRef<HTMLDivElement, Omit<BadgeProps, 'children' | 'classNames'> & { value: LinkData }>(
  ({ value, className, ...props }, ref) => {
    // If the url is already a full url, use it as is.
    // Otherwise, it's a relative url and we need to make it absolute.
    const url = value.url.includes('://') ? value.url : new window.URL(value.url, window.location.href).toString()
    let isGithub = url.startsWith(GITHUB_PREFIX)

    return (
      <Badge
        ref={ref}
        variant="default"
        radius="sm"
        size="sm"
        tt="none"
        leftSection={value.title ? <>{value.title}</> : null}
        rightSection={
          <CopyButton value={url} timeout={1500}>
            {({ copy, copied }) => (
              <ActionIcon
                className={css({
                  opacity: copied ? 1 : 0.45,
                  transition: 'fast',
                  _hover: {
                    opacity: 1,
                  },
                })}
                tabIndex={-1}
                size={'20'}
                variant={copied ? 'light' : 'transparent'}
                color={copied ? 'teal' : 'gray'}
                data-active={copied}
                onClick={e => {
                  e.stopPropagation()
                  e.preventDefault()
                  copy()
                }}
              >
                {copied ? <IconCheck /> : <IconCopy stroke={2.5} />}
              </ActionIcon>
            )}
          </CopyButton>
        }
        {...props}
        className={cx(className, 'group')}
        classNames={{
          root: css({
            flexWrap: 'nowrap',
            minHeight: 24,
            maxWidth: 500,
            userSelect: 'all',
            pr: '0',
            _hover: {
              backgroundColor: {
                base: 'mantine.colors.gray[1]',
                _dark: 'mantine.colors.dark[5]',
              },
            },
          }),
          section: css({
            '&:is([data-position="left"])': {
              color: 'mantine.colors.dimmed',
              userSelect: 'none',
              pointerEvents: 'none',
              _groupHover: {
                color: '[inherit]',
                opacity: .7,
              },
            },
          }),
          label: css({
            '& > a': {
              color: '[inherit]',
              cursor: 'pointer',
              transition: 'fast',
              opacity: {
                base: 0.7,
                _hover: 1,
              },
              textDecoration: {
                base: 'none',
                _hover: 'underline',
              },
            },
          }),
        }}
      >
        <a href={url} target="_blank">
          {isGithub && (
            <GithubIcon
              height="12"
              width="12"
              style={{ verticalAlign: 'middle', marginRight: '4px' }} />
          )}
          {isGithub ? url.replace(GITHUB_PREFIX, '') : url}
        </a>
      </Badge>
    )
  },
)
