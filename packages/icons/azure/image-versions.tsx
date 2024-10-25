// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgImageVersions = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={8.07} x2={8.07} y1={17.35} y2={2.34} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#32bedd" />
        <stop offset={0.3} stopColor="#36c3e1" />
        <stop offset={0.67} stopColor="#41d2ee" />
        <stop offset={1} stopColor="#50e6ff" />
      </linearGradient>
    </defs>
    <rect width={12} height={15.01} x={0.32} y={0.65} fill="#0078d4" rx={0.5} />
    <rect width={12} height={15.01} x={2.07} y={2.34} fill={`url(#a-${suffix})`} rx={0.5} />
    <path
      fill="#773adc"
      d="m17.64 12.79-2.87-2.86a.14.14 0 0 0-.25.1v1.67c-3.45 0-6.9 1.84-6.9 5.17.49-.74 3-2.71 6.9-2.71v1.6a.15.15 0 0 0 .25.11L17.64 13a.17.17 0 0 0 0-.21"
    />
    <path fill="#50e6ff" d="M11.57 6.82v4.07l-3.5 2.05V8.86z" />
    <path fill="#c3f1ff" d="m11.57 6.82-3.5 2.05-3.5-2.05 3.5-2.05z" />
    <path fill="#9cebff" d="M8.07 8.87v4.07l-3.5-2.05V6.82z" />
    <path fill="#c3f1ff" d="m4.57 10.89 3.5-2.03v4.08z" />
    <path fill="#9cebff" d="m11.57 10.89-3.5-2.03v4.08z" />
  </svg>
)}
export default SvgImageVersions
