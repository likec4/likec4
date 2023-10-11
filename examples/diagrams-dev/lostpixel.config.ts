import type { CustomProjectConfig } from 'lost-pixel'
import { isCI } from 'ci-info'

export const config: CustomProjectConfig = {
  ladleShots: {
    // IP should be localhost when running locally & 172.17.0.1 when running in GitHub action
    ladleUrl: `http://${isCI ? '172.17.0.1' : 'localhost'}:61000`
  },
  browser: 'chromium',
  // OSS mode
  generateOnly: true,
  failOnDifference: true
}
