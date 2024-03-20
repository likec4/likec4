import { cn } from '$/lib'
import type { DetailedHTMLProps, HTMLAttributes } from 'react'
import styles from './CodePanel.module.css'

type CodePanelProps = DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>

// Idea from https://daisyui.com/components/mockup-code/
export function CodePanel({ children, className, ...props }: CodePanelProps) {
  return (
    <div className={cn(styles.codePanel, className)} {...props}>
      {children}
    </div>
  )
}
