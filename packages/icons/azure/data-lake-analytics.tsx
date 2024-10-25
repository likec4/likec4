// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgDataLakeAnalytics = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={8.98} x2={8.98} y1={15.81} y2={2.19} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#1988d9" />
        <stop offset={0.9} stopColor="#54aef0" />
      </linearGradient>
    </defs>
    <path
      fill="#50e6ff"
      d="M11.08 17.37 1.37 13a1.48 1.48 0 0 1-.74-1.95L5 1.37a1.48 1.48 0 0 1 2-.74L16.63 5a1.48 1.48 0 0 1 .74 2L13 16.63a1.48 1.48 0 0 1-1.92.74"
    />
    <path
      fill={`url(#a-${suffix})`}
      d="M14.3 15.81H3.65a1.49 1.49 0 0 1-1.48-1.48V3.67a1.49 1.49 0 0 1 1.48-1.48H14.3a1.48 1.48 0 0 1 1.48 1.48v10.66a1.48 1.48 0 0 1-1.48 1.48"
    />
    <path
      fill="#f2f2f2"
      d="M8.73 9.9H7.12A.09.09 0 0 1 7 9.8l2-4.31a.11.11 0 0 1 .09 0h1.89a.09.09 0 0 1 .09.09L8.76 8.93H11a.09.09 0 0 1 .09.09.14.14 0 0 1 0 .06l-3.72 4.28s-.28.25-.16-.1Z"
    />
  </svg>
)}
export default SvgDataLakeAnalytics
