import type { CustomProjectConfig } from 'lost-pixel'
import { isCI } from 'ci-info'
import { resolve } from 'node:path'

export const config: CustomProjectConfig = {
  ladleShots: {
    // IP should be localhost when running locally & 172.17.0.1 when running in GitHub action
    ladleUrl: `http://${isCI ? '172.17.0.1' : 'localhost'}:61000`
  },
  imagePathBaseline: resolve(__dirname, '.lostpixel/baseline'),
  imagePathCurrent: resolve(__dirname, '.lostpixel/current'),
  imagePathDifference: resolve(__dirname, '.lostpixel/difference'),
  // OSS mode
  generateOnly: true,
  failOnDifference: true,

  lostPixelProjectId: 'clmq8wisc3it5j40e3gievrls',
  apiKey: process.env.LOST_PIXEL_API_KEY
}
