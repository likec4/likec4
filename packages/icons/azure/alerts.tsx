// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgAlerts = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={9} x2={9} y1={17.2} y2={-3.28} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#5e9624" />
        <stop offset={0.18} stopColor="#629c25" />
        <stop offset={0.44} stopColor="#6dae2a" />
        <stop offset={0.73} stopColor="#7fcb30" />
        <stop offset={0.82} stopColor="#86d633" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M17.5 2.5v10.83a.58.58 0 0 1-.58.58H12.4a.15.15 0 0 0-.15.14v1.75a.28.28 0 0 1-.45.23l-2.72-2.09h-8a.58.58 0 0 1-.58-.58V2.5a.58.58 0 0 1 .58-.59h15.84a.58.58 0 0 1 .58.59"
    />
    <path
      fill="#fff"
      d="M9.54 9.63H8.38A.36.36 0 0 1 8 9.29l-.2-5.86a.35.35 0 0 1 .35-.36h1.7a.35.35 0 0 1 .35.37L9.89 9.3a.35.35 0 0 1-.35.33"
    />
    <rect width={1.69} height={1.69} x={8.13} y={10.62} fill="#fff" rx={0.61} />
  </svg>
)}
export default SvgAlerts
