import { CheckCircledIcon, CopyIcon } from '@radix-ui/react-icons'
import { Box, IconButton, Tooltip } from '@radix-ui/themes'
import { useCallback, useEffect, useState } from 'react'
import styles from './CopyToClipboard.module.css'

type CopyToClipboardProps = {
  text: string
}
export function CopyToClipboard({ text }: CopyToClipboardProps) {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(() => {
    void navigator.clipboard.writeText(text)
    setCopied(true)
  }, [text])

  useEffect(() => {
    setCopied(false)
  }, [text])

  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => {
        setCopied(false)
      }, 800)
      return () => clearTimeout(timeout)
    }
  }, [copied])

  return (
    <Box position='absolute' top={'0'} right={'0'} p={'4'}>
      <Tooltip
        content={copied ? 'Copied!' : 'Copy to clipboard'}
        {...(copied ? { open: true } : {})}
      >
        <IconButton
          variant='soft'
          color={copied ? 'green' : undefined}
          size={'2'}
          radius='large'
          onClick={copy}
          data-copied={copied}
          className={styles.copyButton}
        >
          {copied ? (
            <CheckCircledIcon width={16} height={16} />
          ) : (
            <CopyIcon width={16} height={16} />
          )}
        </IconButton>
      </Tooltip>
    </Box>
  )
}
