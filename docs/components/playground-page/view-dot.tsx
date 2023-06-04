import { cn } from '$/lib'
import type { DiagramView } from '@likec4/diagrams'
import { printToDot } from '@likec4/layouts'
import { Callout } from "nextra-theme-docs"
import { useMemo, useState } from 'react'
import useSWR from 'swr'

const fetchFromKroki = async (dot: string) => {
  const res = await fetch('https://kroki.io/graphviz', {
    method: 'POST',
    body: JSON.stringify({
      "diagram_source": dot,
      "diagram_type": "graphviz",
      'output_format': "svg"
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  })
  return await res.text()
}

type PlaygroundViewDotProps = {
  diagram: DiagramView
}

export default function PlaygroundViewDot({ diagram }: PlaygroundViewDotProps) {
  const [tab, setTab] = useState<'source' | 'render'>('source')
  const dot = useMemo(() => printToDot(diagram), [diagram])

  const { data } = useSWR(tab == 'render' ? dot : null, fetchFromKroki, {
    revalidateIfStale: false,
    keepPreviousData: true,
  })

  return <div
    className={cn(
      'flex-auto flex m-4 relative overflow-hidden shadow-xl bg-neutral-800/60 sm:rounded-xl dark:backdrop-blur dark:ring-1 dark:ring-inset dark:ring-neutral-700/80',
    )}
  >
    <div className="relative w-full flex flex-col">
      <div className={cn('flex-none border-b border-neutral-500/30')}>
        <div className="flex items-center h-8 space-x-1.5 px-3">
          <div className="w-2.5 h-2.5 bg-neutral-600 rounded-full" />
          <div className="w-2.5 h-2.5 bg-neutral-600 rounded-full" />
          <div className="w-2.5 h-2.5 bg-neutral-600 rounded-full" />
          <div className="flex space-x-1 px-3">
            <div className={cn(
              'text-xs leading-normal p-1',
              'text-slate-900 dark:text-slate-400',
              'cursor-pointer rounded-sm',
              'hover:bg-white hover:bg-opacity-10',
              tab === 'source' && 'font-medium dark:text-slate-300'
            )}
              onClick={() => setTab('source')}
            >
              source
            </div>
            <div className={cn(
              'text-xs leading-normal p-1',
              'text-slate-900 dark:text-slate-400',
              'cursor-pointer rounded-sm',
              'hover:bg-white hover:bg-opacity-10',
              tab === 'render' && 'font-medium dark:text-slate-300'
            )}
              onClick={() => setTab('render')}
            >
              rendered
            </div>
          </div>
        </div>
      </div>
      <div className="relative flex-auto flex">
        <div className="absolute inset-0 overflow-auto">
          <div className="min-w-min min-h-min">
            {tab === 'source' && (
              <pre className={cn(
                'p-4',
                'text-xs font-medium leading-normal',
                'text-slate-900 dark:text-slate-300'
              )}>{dot}</pre>
            )}
            {tab === 'render' && (<>
              {!data && <>loading...</>}
              {data && <div dangerouslySetInnerHTML={{ __html: data }} />}
            </>)}
          </div>
        </div>
      </div>
    </div>
  </div>
  }
