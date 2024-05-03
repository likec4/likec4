import { cn } from '$/lib'
import type { DiagramView } from '@likec4/diagrams'
import { generateMermaid } from '@likec4/generators'
import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { CodePanel } from '../CodePanel'

const fetchFromKroki = async (diagram: string) => {
  const res = await fetch('https://kroki.io/mermaid/svg', {
    method: 'POST',
    body: JSON.stringify({
      diagram_source: diagram,
      diagram_options: {
        theme: 'dark'
      },
      output_format: 'svg'
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  })
  return await res.text()
}

type PlaygroundViewMermaidProps = {
  diagram: DiagramView
}

const tabClassName = (isActive = false) =>
  cn(
    'text-sm font-medium leading-loose px-3',
    'text-slate-400',
    'cursor-pointer rounded-xl',
    'hover:text-slate-300',
    isActive && 'bg-neutral-600 text-slate-300'
  )

export default function PlaygroundViewMermaid({ diagram }: PlaygroundViewMermaidProps) {
  const [tab, setTab] = useState<'source' | 'render'>('source')
  const svg = useMemo(() => generateMermaid(diagram), [diagram])

  const { data } = useSWR(tab == 'render' ? svg : null, fetchFromKroki, {
    revalidateIfStale: false,
    keepPreviousData: true
  })

  return (
    <div className={cn('flex-auto flex m-4 relative overflow-hidden')}>
      <CodePanel
        className={cn('flex-auto flex flex-col')}
        style={{
          padding: 0
        }}
      >
        <div className="pl-24 py-2">
          <div className="inline-flex space-x-1 px-1 py-1 bg-neutral-700 bg-opacity-50 rounded-xl">
            <div className={tabClassName(tab === 'source')} onClick={() => setTab('source')}>
              source
            </div>
            <div className={tabClassName(tab === 'render')} onClick={() => setTab('render')}>
              rendered with kroki
            </div>
          </div>
        </div>
        <div className={'overflow-auto'}>
          {tab === 'source' && <code className="whitespace-pre px-5 pb-2">{svg}</code>}
          {tab === 'render' && (
            <>
              {!data && <>loading...</>}
              {data && <div className="min-w-min min-h-min" dangerouslySetInnerHTML={{ __html: data }} />}
            </>
          )}
        </div>
      </CodePanel>
    </div>
  )
}
