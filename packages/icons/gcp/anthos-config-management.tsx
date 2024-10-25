// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgAnthosConfigManagement = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <path
      d="M16.39 14V9.47l-4-2.29v-3.4h-.86v3.4l-4 2.29V14l-3 1.75.43.74 3-1.75H8l4 2.28 4-2.28 2.93 1.69.43-.74Zm-2.33.88a.83.83 0 0 1-.69-.39H9.13v-.85h4.24a.83.83 0 0 1 .69-.39.82.82 0 0 1 0 1.63m.81-2.49H12.7a.81.81 0 0 1-1.4 0H9.13v-.86h2.19a.81.81 0 0 1 1.36 0h2.19Zm0-2.11h-4.24a.83.83 0 0 1-.69.39.82.82 0 0 1 0-1.63.83.83 0 0 1 .69.39h4.24Z"
      fill="#4285f4"
    />
    <path
      d="M20.56 7.56v8.87a.87.87 0 0 1-.44.76l-7.68 4.44a.9.9 0 0 1-.44.12v-1.59l7.07-4.08V7.92L12 3.84V2.25a1 1 0 0 1 .44.11l7.68 4.44a.89.89 0 0 1 .44.76"
      fill="#669df6"
    />
    <path
      d="M3.44 7.56v8.87a.87.87 0 0 0 .44.76l7.68 4.44a.9.9 0 0 0 .44.12v-1.59l-7.07-4.08V7.92L12 3.84V2.25a1 1 0 0 0-.44.11L3.88 6.8a.89.89 0 0 0-.44.76"
      fill="#aecbfa"
    />
  </svg>
)}
export default SvgAnthosConfigManagement
