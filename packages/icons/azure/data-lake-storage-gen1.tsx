// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgDataLakeStorageGen1 = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={9.24} x2={8.85} y1={0.96} y2={16.52} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#32d4f5" />
        <stop offset={0.23} stopColor="#31d0f1" />
        <stop offset={0.46} stopColor="#2cc3e6" />
        <stop offset={0.7} stopColor="#25afd4" />
        <stop offset={0.94} stopColor="#1c92ba" />
        <stop offset={1} stopColor="#198ab3" />
      </linearGradient>
    </defs>
    <path
      fill="#005ba1"
      d="M17.1 3.6H9.69a.34.34 0 0 1-.22-.07L7.35 2.12a.43.43 0 0 0-.22-.06H.9a.4.4 0 0 0-.4.39v13.1a.4.4 0 0 0 .4.39h16.2a.4.4 0 0 0 .4-.39V4a.4.4 0 0 0-.4-.4"
    />
    <rect width={3.86} height={0.77} x={2.05} y={2.82} fill="#fff" rx={0.16} />
    <rect width={0.77} height={0.77} x={2.05} y={2.82} fill="#1ac3f2" rx={0.11} />
    <path
      fill={`url(#a-${suffix})`}
      d="M17.1 3.58H9a.36.36 0 0 0-.28.12L7.37 5a.43.43 0 0 1-.28.11H.9a.4.4 0 0 0-.4.4v10a.4.4 0 0 0 .4.39h16.2a.4.4 0 0 0 .4-.39V4a.4.4 0 0 0-.4-.42"
    />
    <path
      fill="#fff"
      d="M10.18 5.7a.15.15 0 0 0-.08 0s-.09 0-.13.07l-3.16 4.59a.16.16 0 0 0 0 .16.19.19 0 0 0 .15.1h1.87L8 13.4a.13.13 0 0 0 .07.18.1.1 0 0 0 .07 0c.06 0 .09 0 .13-.07l3.26-4.66v-.1a.17.17 0 0 0-.17-.16h-2l.81-2.73a.13.13 0 0 0 .01-.16"
    />
  </svg>
)}
export default SvgDataLakeStorageGen1
