// @ts-nocheck

import type { SVGProps } from 'react'
const SvgSearch = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <radialGradient id="a" cx={10.629} cy={7.175} r={6.675} gradientUnits="userSpaceOnUse">
        <stop offset={0.225} stopColor="#32d4f5" />
        <stop offset={0.59} stopColor="#32d2f2" />
        <stop offset={0.825} stopColor="#32caea" />
        <stop offset={1} stopColor="#32bedd" />
      </radialGradient>
    </defs>
    <rect
      width={9.73}
      height={2.216}
      x={-0.375}
      y={12.598}
      fill="#198ab3"
      rx={1.036}
      transform="rotate(-45 4.491 13.706)"
    />
    <circle cx={10.629} cy={7.175} r={6.675} fill="url(#a)" />
    <circle cx={10.615} cy={7.056} r={5.243} fill="#fff" />
    <path fill="#c3f1ff" d="M5.535 8.353S6.97 1.171 13.676 2.8a5.14 5.14 0 0 0-6.186.047 5.12 5.12 0 0 0-1.955 5.506" />
  </svg>
)
export default SvgSearch
