// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgAppSpace = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 36 36" {...props}>
    <g clipPath={`url(#a-${suffix})`}>
      <path
        fill={`url(#b-${suffix})`}
        d="M6.136 16.304c0 6.034 4.908 10.944 10.944 10.944 4.952 0 8.98-4.028 8.98-8.98 0-.368.282-.676.648-.71a.715.715 0 0 1 .766.582 8.7 8.7 0 0 1 .14 1.556c0 6.146-5 11.148-11.148 11.148-7.838 0-14.216-6.378-14.216-14.216a1.124 1.124 0 1 0-2.248 0C0 25.706 7.388 33.094 16.466 33.094c7.388 0 13.398-6.01 13.398-13.398 0-6.036-4.908-10.944-10.944-10.944-4.952 0-8.98 4.028-8.98 8.98a.715.715 0 0 1-.648.71.715.715 0 0 1-.766-.582 8.7 8.7 0 0 1-.14-1.556c0-6.146 5-11.146 11.148-11.146 7.838 0 14.216 6.376 14.216 14.216a1.124 1.124 0 1 0 2.248 0c0-9.078-7.388-16.466-16.466-16.466-7.388 0-13.398 6.01-13.398 13.396z"
      />
      <path
        fill="#32BEDD"
        d="M30 31.5v3a1.5 1.5 0 0 0 1.5 1.5h3a1.5 1.5 0 0 0 1.5-1.5v-3a1.5 1.5 0 0 0-1.5-1.5h-3a1.5 1.5 0 0 0-1.5 1.5M2 5v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1M32 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1"
      />
      <path
        fill="#50E6FF"
        d="M14 21v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1M18 13v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1"
      />
    </g>
    <defs>
      <linearGradient id={`b-${suffix}`} x1={18} x2={18} y1={2} y2={38} gradientUnits="userSpaceOnUse">
        <stop stopColor="#5EA0EF" />
        <stop offset={1} stopColor="#0078D4" />
      </linearGradient>
      <clipPath id={`a-${suffix}`}>
        <path fill="#fff" d="M0 36V0h36v36z" />
      </clipPath>
    </defs>
  </svg>
)}
export default SvgAppSpace
