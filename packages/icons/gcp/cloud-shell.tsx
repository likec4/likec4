// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgCloudShell = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <g data-name="Product Icons">
      <g data-name="Cloud-Shell shaded 32px">
        <path
          d="M20.2 2.67H3.8A1.79 1.79 0 0 0 2 4.47v10.8a1.79 1.79 0 0 0 1.8 1.8H10v2.26H8v2h8v-2h-2v-2.26h6.2a1.79 1.79 0 0 0 1.8-1.8V4.47a1.79 1.79 0 0 0-1.8-1.8m-3.53 12h-4v-2h4Zm0-4.54-9.07 3.8v-1.86l6.53-2.8L7.6 6.4V4.53l9.07 3.74Z"
          fill="#aecbfa"
        />
        <path d="M10 17.07h4v2.26h-4z" fill="#4285f4" />
        <path d="M8 19.33h8v2H8z" fill="#669df6" />
      </g>
    </g>
  </svg>
)}
export default SvgCloudShell
