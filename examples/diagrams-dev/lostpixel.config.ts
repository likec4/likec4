import type { CustomProjectConfig } from 'lost-pixel'

export const config: CustomProjectConfig = {
  ladleShots: {
    // IP should be localhost when running locally & 172.17.0.1 when running in GitHub action
    // ladleUrl: `http://${isCI ? '172.17.0.1' : 'localhost'}:61000`
    ladleUrl: `http://localhost:61000`
  },
  // OSS mode
  generateOnly: true,
  failOnDifference: true
}
