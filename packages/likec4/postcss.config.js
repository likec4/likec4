import autoprefixer from 'autoprefixer'
// @ts-ignore
import nesting from 'tailwindcss/nesting/index.js'
import tailwindcss from 'tailwindcss'

const config = {
  plugins: [nesting, tailwindcss, autoprefixer]
}

export default config
