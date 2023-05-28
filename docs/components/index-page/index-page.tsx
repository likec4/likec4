import { cn } from '$/lib'
import { Noto_Sans } from 'next/font/google'
import type { PropsWithChildren } from 'react'
import dynamic from 'next/dynamic'

const LikeC4View = dynamic({
  loader: () => import('./LikeC4Diagram'),
  loading: () => <div>loading...</div>,
  ssr: false,
})


const heroFont = Noto_Sans({
  preload: true,
  display: 'swap',
  weight: ['500'],
  subsets: ['latin']
})

export const Hero = () => (
  <section className={cn(
    'w-full flex flex-col space-y-4 lg:space-y-6 items-center',
    'mt-8 md:mt-12 lg:mt-20',
    'px-7 md:px-4'
  )}>
    <h1 className={cn(
      'text-[min(3.75rem,max(6vw,2.25rem))]',
      'tracking-tight leading-none',
      'text-transparent bg-clip-text bg-gradient-to-br from-[#F8F3D4] to-[#5E98AF]',
      heroFont.className
    )}>Architecture as a code</h1>
    <div className={cn(
      'text-center text-[min(1.5rem,max(3vw,1.25rem))] max-w-4xl',
      'leading-tight',
      'text-transparent bg-clip-text bg-gradient-to-r from-[#F8F3D4] to-[#5E98AF]',
      heroFont.className
    )}>
      Live diagrams from the "like c4" model, managed by open-source tooling as code in your repository, under your control.
    </div>
  </section>
)

export const HeroVideo = () => (
  <section className={cn(
    'w-full',
    'mt-12 md:mt-16',
    'px-4',
  )}>
    <div className="w-full max-w-[1000px] mx-auto">
      <div className="relative overflow-hidden flex rounded-xl">
        <video autoPlay loop playsInline muted poster="/index-page-video.png">
          <source src="/index-page.mp4" type="video/mp4" />
        </video>
      </div>
    </div>
  </section>
)

export const IndexPageSection = ({children}: PropsWithChildren) => (
  <section className={cn(
    'w-full max-w-5xl mx-auto',
    'mt-8',
    'px-4',
  )}>
    {children}
  </section>
)


export const IndexPageDiagram = () => (
  <div className='mt-6'>
    <LikeC4View viewId='index'/>
  </div>
)
// export const IndexPageHero = () => {
//   return <>
//     <div className={styles.hero}>
//       <div className={styles.hero_ratio}>
//         <div className={styles.logo}>
//           <Logo />
//         </div>

//       </div>
//     </div>
//     <div className="my-6 w-full max-w-[1000px] mx-auto">
//       <div className="p-1 relative overflow-hidden shadow-xl flex bg-neutral-800/60 sm:rounded-xl dark:backdrop-blur dark:ring-neutral-700/80">
//         <video autoPlay loop playsInline>
//           <source src="https://github-production-user-asset-6210df.s3.amazonaws.com/824903/238808661-24521327-25d6-44ae-a6b4-6eb492242862.mp4" type="video/mp4" />
//         </video>
//       </div>
//     </div>
//   </>
// }
