/**
 * Script for embedding LikeC4Views in a web page.
 */
import { LikeC4Views } from '~likec4-dimensions'

let BASE = import.meta.env.BASE_URL
if (!BASE.endsWith('/')) {
  BASE = BASE + '/'
}

export default {
  log: () => {
    console.log(BASE)
    console.log('LikeC4Views')
    console.dir(LikeC4Views)
  }
}
