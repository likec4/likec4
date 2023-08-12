import type { DetailedHTMLProps, HTMLAttributes } from 'react'
import { cn } from '$/lib'

type CodeBlockProps = DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>

export function CodeWindow({ children, className, ...props}: CodeBlockProps) {
  const border = true
  return (
    <div
      className={cn(
        'relative overflow-hidden shadow-xl flex bg-neutral-800/60 sm:rounded-xl dark:backdrop-blur dark:ring-1 dark:ring-inset dark:ring-neutral-700/80',
        className
      )}
      {...props}
    >
      <div className="relative w-full flex flex-col">
        <div className={cn('flex-none', border && 'border-b border-neutral-500/30')}>
          <div className="flex items-center h-8 space-x-1.5 px-3">
            <div className="w-2.5 h-2.5 bg-neutral-600 rounded-full" />
            <div className="w-2.5 h-2.5 bg-neutral-600 rounded-full" />
            <div className="w-2.5 h-2.5 bg-neutral-600 rounded-full" />
          </div>
          {/* <div className="h-px bg-gradient-to-r from-sky-300/0 via-sky-300/20 to-sky-300/0" /> */}
        </div>
        <div className="relative flex-auto flex">
          <div className="absolute inset-0 overflow-auto">
            <div className="min-w-min min-h-min">
            {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
