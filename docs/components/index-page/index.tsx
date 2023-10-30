import { cn } from '$/lib'
import { Noto_Sans } from 'next/font/google'
import type { PropsWithChildren } from 'react'
import type { LikeC4ViewId } from './generated'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import styles from './index.module.css'

const LikeC4EmbeddedView = dynamic({
  loader: () => import('./generated').then(m => m.Embedded),
  loading: () => <div>rendering...</div>,
  ssr: false
})

const heroFont = Noto_Sans({
  preload: true,
  display: 'swap',
  weight: ['500'],
  subsets: ['latin']
})

export const Hero = () => (
  <section
    className={cn(
      'w-full flex flex-col space-y-4 lg:space-y-6 items-center',
      'mt-8 md:mt-12 lg:mt-20'
    )}
  >
    <h1
      className={cn(
        'text-center text-[min(3.75rem,max(6vw,2.25rem))]',
        'tracking-tight leading-none whitespace-nowrap',
        'text-transparent bg-clip-text bg-gradient-to-br from-[#F8F3D4] to-[#5E98AF]',
        heroFont.className
      )}
    >
      Architecture as a code
    </h1>
    <div
      className={cn(
        'text-center text-[min(1.5rem,max(3vw,1.25rem))] max-w-[46rem]',
        'leading-tight',
        'text-transparent bg-clip-text bg-gradient-to-r from-[#F8F3D4] to-[#5E98AF]',
        heroFont.className
      )}
    >
      Visualize, collaborate, and evolve the software architecture with always actual and live
      diagrams from your code
    </div>
  </section>
)

export const HeroVideo = () => (
  <section className={cn('w-full', 'mt-12 md:mt-16')}>
    <div className='w-full max-w-[1000px] mx-auto'>
      <div className='relative overflow-hidden flex rounded-xl'>
        <video autoPlay loop playsInline muted poster='/index-page-video.png'>
          <source src='/index-page.mp4' type='video/mp4' />
        </video>
      </div>
    </div>
  </section>
)

export const GetStartedButton = () => (
  <section className={cn('w-full', 'mt-6', 'text-center')}>
    <Link
      href={'/docs/'}
      className={cn(
        heroFont.className,
        'inline-flex items-center justify-center rounded-md text-md',
        'text-black',
        'bg-gradient-to-br from-[#F8F3D4] to-[#5E98AF]',
        'hover:bg-opacity-40',
        'px-3 py-2'
      )}
    >
      Get Started
    </Link>
  </section>
)

type IndexPageSectionProps = PropsWithChildren<{
  title?: string
}>

export const IndexPageSection = ({ title, children }: IndexPageSectionProps) => (
  <section className={cn('w-full max-w-5xl mx-auto', 'mt-16 md:mt-28')}>
    {title && (
      <div className='mx-auto max-w-[42rem] my-8 md:my-12'>
        <h2
          className={cn(
            'text-center text-[min(2.25rem,max(3vw,1.5rem))]',
            'leading-tight',
            'text-transparent bg-clip-text bg-gradient-to-r from-[#F8F3D4] to-[#5E98AF]',
            heroFont.className
          )}
        >
          {title}
        </h2>
      </div>
    )}
    {children}
  </section>
)

export const IndexPageWhy = () => (
  <div>
    <div>
      <div>Code</div>
      <img src='/index-page-likec4-file.png' />
    </div>
  </div>
)

export const IndexPageDiagram = () => (
  <div className='mt-6'>
    <LikeC4EmbeddedView viewId='index' />
  </div>
)

export const LikeC4View = ({
  viewId,
  noBrowser = false
}: {
  viewId: LikeC4ViewId
  noBrowser?: boolean
}) => (
  <div className={styles.embedded}>
    <LikeC4EmbeddedView animate viewId={viewId} noBrowser={noBrowser} />
  </div>
)
