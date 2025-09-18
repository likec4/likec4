import { defineConfig } from 'likec4/config'
import generators from './likec4-generators'

export default defineConfig({
  name: 'dyn-config',
  title: 'Dynamic Config',
  generators,
  styles: {
    defaults: {
      color: 'amber',
      opacity: 60,
      size: 'sm',
    },
  },
})
