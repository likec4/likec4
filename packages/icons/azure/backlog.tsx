// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgBacklog = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={3.439} x2={3.439} y1={6.801} y2={1.432} gradientUnits="userSpaceOnUse">
        <stop offset={0.2} stopColor="#0078d4" />
        <stop offset={0.287} stopColor="#1380da" />
        <stop offset={0.759} stopColor="#5ea0ef" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={3.439} x2={3.439} y1={11.998} y2={6.628} gradientUnits="userSpaceOnUse">
        <stop offset={0.2} stopColor="#0078d4" />
        <stop offset={0.287} stopColor="#1380da" />
        <stop offset={0.759} stopColor="#5ea0ef" />
      </linearGradient>
      <linearGradient id={`c-${suffix}`} x1={3.439} x2={3.439} y1={17.194} y2={11.824} gradientUnits="userSpaceOnUse">
        <stop offset={0.2} stopColor="#0078d4" />
        <stop offset={0.287} stopColor="#1380da" />
        <stop offset={0.759} stopColor="#5ea0ef" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="m6.437 1.856-.292-.292a.5.5 0 0 0-.707 0L2.606 4.392 1.441 3.229a.5.5 0 0 0-.707 0l-.293.293a.5.5 0 0 0 0 .707l1.812 1.815a.5.5 0 0 0 .354.146.5.5 0 0 0 .353-.146l3.477-3.481a.5.5 0 0 0 0-.707"
    />
    <rect width={10.366} height={1.895} x={7.339} y={2.949} fill="#a3a3a3" rx={0.923} />
    <rect width={10.366} height={1.895} x={7.339} y={8.073} fill="#a3a3a3" rx={0.923} />
    <rect width={10.366} height={1.895} x={7.339} y={13.196} fill="#a3a3a3" rx={0.923} />
    <path
      fill={`url(#b-${suffix})`}
      d="m6.437 7.053-.292-.293a.5.5 0 0 0-.707 0L2.606 9.588 1.441 8.425a.5.5 0 0 0-.707 0l-.293.293a.5.5 0 0 0 0 .707l1.812 1.815a.5.5 0 0 0 .354.147.5.5 0 0 0 .353-.147l3.477-3.48a.5.5 0 0 0 0-.707"
    />
    <path
      fill={`url(#c-${suffix})`}
      d="m6.437 12.249-.292-.293a.5.5 0 0 0-.354-.146.5.5 0 0 0-.353.146l-2.832 2.828-1.165-1.163a.5.5 0 0 0-.707 0l-.293.292a.5.5 0 0 0 0 .707l1.812 1.815a.5.5 0 0 0 .707 0l3.477-3.48a.5.5 0 0 0 0-.706"
    />
  </svg>
)}
export default SvgBacklog
