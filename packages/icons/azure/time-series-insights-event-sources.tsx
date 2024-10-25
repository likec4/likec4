// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgTimeSeriesInsightsEventSources = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={9.03} x2={9.03} y1={13.38} y2={4.63} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#198ab3" />
        <stop offset={0.4} stopColor="#25aed3" />
        <stop offset={0.78} stopColor="#2fcaec" />
        <stop offset={1} stopColor="#32d4f5" />
      </linearGradient>
    </defs>
    <rect width={8.75} height={8.75} x={4.65} y={4.63} fill={`url(#a-${suffix})`} rx={0.41} />
    <path fill="#fff" d="M7.31 12.53" />
    <path
      fill="#c3f1ff"
      d="m11.78 12.18 4.38-3.07a.13.13 0 0 0 0-.22l-4.38-3.06a.13.13 0 0 0-.21.11V7.7H4.65v2.6h6.92v1.77a.14.14 0 0 0 .21.11"
    />
    <path
      fill="#949494"
      d="M17 17.6H1a.52.52 0 0 1-.52-.52V.92A.52.52 0 0 1 1 .4h16a.52.52 0 0 1 .52.52V6a.26.26 0 0 1-.41.22l-1-.7A.27.27 0 0 1 16 5.3V2H2.06v14h13.88v-3.2a.26.26 0 0 1 .11-.21l1-.73a.26.26 0 0 1 .41.22v5a.52.52 0 0 1-.46.52"
    />
    <path
      fill="#767676"
      d="M15.94 2v3.25a.27.27 0 0 0 .11.22l1 .7A.26.26 0 0 0 17.5 6V2ZM15.94 16v-3.25a.25.25 0 0 1 .11-.21l1-.71a.27.27 0 0 1 .41.22v4Z"
    />
  </svg>
)}
export default SvgTimeSeriesInsightsEventSources
