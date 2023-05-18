import { cn } from '$/lib'
import type { DiagramView } from '@likec4/diagrams'
import { generateD2 } from '@likec4/generators'
import { useMemo, useState } from 'react'
import useSWR from 'swr'

// const fetcher = async (d2: string) => {
//   fetch({
//     method: 'POST',
//     url: 'kroki.io',
//   }).then(r => r.text()
// }
const fetchFromKroki = async (d2: string) => {
  const res = await fetch('https://kroki.io/d2/svg', {
    method: 'POST',
    body: JSON.stringify({
      "diagram_source": d2,
      "diagram_options": {
        "theme": "colorblind-clear"
      },
      'output_format': "svg"
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  })
  return await res.text()
}

type PlaygroundViewD2Props = {
  diagram: DiagramView
}

export default function PlaygroundViewD2({ diagram }: PlaygroundViewD2Props) {
  const [tab, setTab] = useState<'source' | 'render'>('source')
  const d2 = useMemo(() => generateD2(diagram), [diagram])

  const { data } = useSWR(tab == 'render' ? d2 : null, fetchFromKroki, {
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
              )}>{d2}</pre>
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
