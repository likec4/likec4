import { type AppProps } from 'next/app'
import { Inter } from 'next/font/google'

const inter = Inter({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  preload: true
})

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <style jsx global>{`
        :root {
          --font-inter: ${inter.style.fontFamily};
        }
      `}</style>
      <Component {...pageProps} />
    </>
  )
}
