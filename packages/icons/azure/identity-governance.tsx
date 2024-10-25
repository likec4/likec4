// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgIdentityGovernance = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={9} x2={9} y1={7.11} y2={14.2} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#a67af4" />
        <stop offset={1} stopColor="#552f99" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={8.8} x2={9.32} y1={3.31} y2={9.75} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#a67af4" />
        <stop offset={1} stopColor="#552f99" />
      </linearGradient>
    </defs>
    <path
      fill="#0078d4"
      d="M2.15 11.75a7.34 7.34 0 0 1 1-7.2 1.94 1.94 0 0 1-.7-.83 8.48 8.48 0 0 0-1.17 8.6 3.1 3.1 0 0 1 .87-.57M5.94 1.14a3.1 3.1 0 0 1 .62.9A7.5 7.5 0 0 1 9 1.61 7.33 7.33 0 0 1 13.33 3a2.15 2.15 0 0 1 .55-.69l.12-.09a8.44 8.44 0 0 0-8.06-1.08m9.91 5.12a7.32 7.32 0 0 1-1 7.19 2 2 0 0 1 .43.4 2 2 0 0 1 .27.43 8.48 8.48 0 0 0 1.17-8.6 3.1 3.1 0 0 1-.87.58M11.44 16a7.3 7.3 0 0 1-2.44.39A7.32 7.32 0 0 1 4.67 15a2.05 2.05 0 0 1-.55.69l-.12.09a8.48 8.48 0 0 0 8.09 1.09 3.1 3.1 0 0 1-.65-.87"
    />
    <path fill="#32bedd" d="M5.18 1.87a2.09 2.09 0 1 1-3 0 2.09 2.09 0 0 1 3 0" />
    <path fill="#fff" d="M4.42 4.07a1 1 0 0 0 0-1.45 1 1 0 0 0-1.42 0 1 1 0 0 0 0 1.45 1 1 0 0 0 1.44 0" />
    <path fill="#32bedd" d="M13.18 1.87a2.09 2.09 0 1 1 0 3 2.09 2.09 0 0 1 0-2.95Z" />
    <path fill="#fff" d="M15.38 2.62a1 1 0 1 0 0 1.45 1 1 0 0 0 0-1.45" />
    <path fill="#32bedd" d="M12.82 16.13a2.09 2.09 0 1 1 3 0 2.09 2.09 0 0 1-3 0" />
    <path fill="#fff" d="M13.58 13.93a1 1 0 0 0 0 1.45 1 1 0 0 0 1.44 0 1 1 0 0 0 0-1.45 1 1 0 0 0-1.44 0" />
    <path fill="#32bedd" d="M4.82 16.13a2.09 2.09 0 1 1 0-2.95 2.09 2.09 0 0 1 0 2.95" />
    <path fill="#fff" d="M2.62 15.38a1 1 0 1 0 0-1.45 1 1 0 0 0 0 1.45" />
    <path
      fill={`url(#a-${suffix})`}
      d="M12.51 12.92a.76.76 0 0 0 .76-.76v-.09C13 9.69 11.61 7.74 9 7.74s-4 1.65-4.26 4.34a.76.76 0 0 0 .68.84z"
    />
    <path fill="#fff" d="M9 8.31a2.4 2.4 0 0 1-1.3-.38L9 11.28 10.27 8A2.37 2.37 0 0 1 9 8.31" opacity={0.8} />
    <circle cx={9.01} cy={5.92} r={2.39} fill={`url(#b-${suffix})`} />
  </svg>
)}
export default SvgIdentityGovernance
