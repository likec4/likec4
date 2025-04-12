import { defineConfig } from '@likec4/styles/dev'

export default defineConfig({
  include: [
    './app/src/**/*.{ts,tsx}',
    './app/webcomponent/**/*.{ts,tsx}',
    './app/react/**/*.{ts,tsx}',
    '../diagram/src/**/*.{js,jsx,ts,tsx}',
  ],
})
