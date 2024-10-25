// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgVitejs = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" {...props}>
    <defs>
      <linearGradient
        id={`a-${suffix}`}
        x1={6}
        x2={235}
        y1={33}
        y2={344}
        gradientTransform="translate(0 .937)scale(.3122)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#41d1ff" />
        <stop offset={1} stopColor="#bd34fe" />
      </linearGradient>
      <linearGradient
        id={`b-${suffix}`}
        x1={194.651}
        x2={236.076}
        y1={8.818}
        y2={292.989}
        gradientTransform="translate(0 .937)scale(.3122)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#ffea83" />
        <stop offset={0.083} stopColor="#ffdd35" />
        <stop offset={1} stopColor="#ffa800" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M124.766 19.52 67.324 122.238c-1.187 2.121-4.234 2.133-5.437.024L3.305 19.532c-1.313-2.302.652-5.087 3.261-4.622L64.07 25.187a3.1 3.1 0 0 0 1.11 0l56.3-10.261c2.598-.473 4.575 2.289 3.286 4.594m0 0"
    />
    <path
      fill={`url(#b-${suffix})`}
      d="M91.46 1.43 48.954 9.758a1.56 1.56 0 0 0-1.258 1.437l-2.617 44.168a1.563 1.563 0 0 0 1.91 1.614l11.836-2.735a1.562 1.562 0 0 1 1.88 1.836l-3.517 17.219a1.562 1.562 0 0 0 1.985 1.805l7.308-2.223c1.133-.344 2.223.652 1.985 1.812l-5.59 27.047c-.348 1.692 1.902 2.614 2.84 1.164l.625-.968 34.64-69.13c.582-1.16-.421-2.48-1.69-2.234l-12.185 2.352a1.558 1.558 0 0 1-1.793-1.965l7.95-27.562A1.56 1.56 0 0 0 91.46 1.43m0 0"
    />
  </svg>
)}
export default SvgVitejs
