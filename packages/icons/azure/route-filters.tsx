// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgRouteFilters = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient
        id={`a-${suffix}`}
        x1={5.82}
        x2={5.82}
        y1={25.68}
        y2={14.64}
        gradientTransform="matrix(1 0 0 1.01 0 -11.41)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#5e9624" />
        <stop offset={0.01} stopColor="#5f9724" />
        <stop offset={0.35} stopColor="#6cab29" />
        <stop offset={0.68} stopColor="#73b82c" />
        <stop offset={1} stopColor="#76bc2d" />
      </linearGradient>
    </defs>
    <path
      fill="#0078d4"
      d="m18 9.16-2.12 2.12a.1.1 0 0 1-.18-.08V10a.11.11 0 0 0-.11-.1h-3.5l2.18 2.1a.09.09 0 0 0 .12 0l.61-.62a.08.08 0 0 1 .14.06v2.19a.12.12 0 0 1-.12.12h-2.15a.08.08 0 0 1-.06-.14l.62-.61a.09.09 0 0 0 0-.12L11.64 11V7.17l1.83-1.82a.08.08 0 0 0 0-.11l-.62-.61a.08.08 0 0 1 .06-.14h2.19a.13.13 0 0 1 .12.13v2.13a.08.08 0 0 1-.14.06l-.61-.61a.09.09 0 0 0-.12 0l-2.23 2.11h3.43a.11.11 0 0 0 .11-.11V7a.1.1 0 0 1 .18-.08L18 9a.1.1 0 0 1 0 .16"
    />
    <rect width={11.64} height={11.18} y={3.41} fill={`url(#a-${suffix})`} rx={0.58} />
    <g fill="#fff">
      <rect width={2.73} height={2.61} x={2.27} y={4.78} rx={0.29} />
      <rect width={2.73} height={2.61} x={6.92} y={7.77} rx={0.29} />
      <rect width={2.73} height={2.61} x={2.27} y={10.61} rx={0.29} />
    </g>
  </svg>
)}
export default SvgRouteFilters
