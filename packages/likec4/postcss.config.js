import autoprefixer from 'autoprefixer'
import nesting from 'tailwindcss/nesting'
import tailwindcss from 'tailwindcss'

const config = {
  plugins: [nesting, tailwindcss, autoprefixer]
}

export default config
