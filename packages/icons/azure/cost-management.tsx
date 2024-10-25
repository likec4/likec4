// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgCostManagement = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={9} x2={9} y1={1.48} y2={17.07} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#76bc2d" />
        <stop offset={0.32} stopColor="#73b82c" />
        <stop offset={0.65} stopColor="#6cab29" />
        <stop offset={0.99} stopColor="#5e9724" />
        <stop offset={1} stopColor="#5e9624" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={6.13} x2={11.87} y1={9.28} y2={9.28} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#fff" />
        <stop offset={1} stopColor="#fff" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M12.35 1.48h-6.7a2 2 0 0 0-1.73 1L.58 8.28a2 2 0 0 0 0 2l3.34 5.79a2 2 0 0 0 1.73 1h6.7a2 2 0 0 0 1.73-1l3.34-5.79a2 2 0 0 0 0-2l-3.34-5.8a2 2 0 0 0-1.73-1"
    />
    <path
      fill={`url(#b-${suffix})`}
      d="M9.07 4.81A.82.82 0 0 1 8.25 4a.82.82 0 0 1 1.64 0 .82.82 0 0 1-.82.81m-.82 9.75a.82.82 0 1 0 1.64 0 .82.82 0 0 0-1.64 0m.84-2.7A1.5 1.5 0 0 1 7.58 11l-1.45.28A2.68 2.68 0 0 0 9 13c1.69 0 2.91-.89 2.91-2.13a2.07 2.07 0 0 0-1.12-2A13 13 0 0 0 9 8.33c-.67-.16-1.1-.53-1.1-1A1 1 0 0 1 9 6.46a1.4 1.4 0 0 1 1.29.69l1.25-.4A2.56 2.56 0 0 0 9 5.45c-1.18 0-2.55.52-2.55 2 0 1.81 1.11 2.17 2.69 2.48.37.07 1.23.32 1.23 1-.04.38-.37.93-1.28.93"
      opacity={0.9}
    />
  </svg>
)}
export default SvgCostManagement
