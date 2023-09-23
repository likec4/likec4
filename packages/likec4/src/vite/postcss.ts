import autoprefixer from 'autoprefixer'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import nesting from 'tailwindcss/nesting'
import tailwindcss from 'tailwindcss'
import type { CSSOptions } from 'vite'
import tailwindcssAnimate from 'tailwindcss-animate'
import { radixThemePreset } from 'radix-themes-tw'

const __dirname = dirname(fileURLToPath(import.meta.url))

export const postcss = (): CSSOptions['postcss'] => {
  return {
    map: {
      inline: true
    },
    plugins: [
      nesting() as any,
      tailwindcss(),
      // tailwindcss({
      //   presets: [radixThemePreset],
      //   plugins: [
      //     tailwindcssAnimate,
      //   ],
      //   corePlugins: {
      //     preflight: false,
      //   },
      //   content: [
      //     './app/**/*.{js,jsx,ts,tsx,md,mdx}',
      //     resolve(__dirname, '../../app/**/*.{js,jsx,ts,tsx,md,mdx}')
      //   ]
      // }),
      autoprefixer()
    ]
  }
}
