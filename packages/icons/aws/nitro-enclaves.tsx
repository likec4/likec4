// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgNitroEnclaves = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1="0%" x2="100%" y1="100%" y2="0%">
        <stop offset="0%" stopColor="#C8511B" />
        <stop offset="100%" stopColor="#F90" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <path fill={`url(#a-${suffix})`} d="M0 0h80v80H0z" />
      <path
        fill="#FFF"
        d="M32.144 47H38.6a1 1 0 0 1 .977 1.217l-1.735 7.804L47.857 42h-6.456a1 1 0 0 1-.977-1.217l1.735-7.804zM35.8 61.6a.999.999 0 0 1-.976-1.217L37.353 49h-7.152a1.001 1.001 0 0 1-.814-1.581l14-19.6a.999.999 0 0 1 1.79.798L42.648 40H49.8a1.001 1.001 0 0 1 .814 1.581l-14 19.6a1 1 0 0 1-.814.419M23 66h34V26a1 1 0 0 1 1-1h4V14h-7v6a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-6h-8v6a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-6h-7v11h4a1 1 0 0 1 1 1zm35 2H22a1 1 0 0 1-1-1V27h-4a1 1 0 0 1-1-1V13a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v6h7v-6a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6h7v-6a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-4v40a1 1 0 0 1-1 1"
      />
    </g>
  </svg>
)}
export default SvgNitroEnclaves
