// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgWorkbooks = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={8.881} x2={8.881} y1={17.5} y2={2.093} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#0078d4" />
        <stop offset={0.817} stopColor="#5ea0ef" />
      </linearGradient>
    </defs>
    <path
      fill="#005ba1"
      d="M2.659 2.109 3.87.7a.6.6 0 0 1 .444-.2h11.613a.813.813 0 0 1 .888.831v14.5a.6.6 0 0 1-.192.435l-1.308 1.191H3.444l-.8-.337Z"
    />
    <path
      fill="#fff"
      d="m3.633 2.1.742-.846a.52.52 0 0 1 .393-.179h10.846a.52.52 0 0 1 .522.522v13.786a.52.52 0 0 1-.171.386l-1.158 1.055Z"
    />
    <path
      fill={`url(#a-${suffix})`}
      d="M14.736 2.093H2.7a.056.056 0 0 0-.056.056v14.966a.385.385 0 0 0 .385.385h11.71a.385.385 0 0 0 .385-.385V2.478a.386.386 0 0 0-.388-.385"
    />
    <rect width={6.005} height={2.382} x={6.028} y={6.2} fill="#fff" rx={0.27} />
    <rect width={2.448} height={1.441} x={1.185} y={3.608} fill="#005ba1" rx={0.59} />
    <rect width={2.448} height={1.441} x={1.185} y={6.346} fill="#005ba1" rx={0.59} />
    <rect width={2.448} height={1.441} x={1.185} y={9.084} fill="#005ba1" rx={0.59} />
    <rect width={2.448} height={1.441} x={1.185} y={11.821} fill="#005ba1" rx={0.59} />
    <rect width={2.448} height={1.441} x={1.185} y={14.559} fill="#005ba1" rx={0.59} />
  </svg>
)}
export default SvgWorkbooks
