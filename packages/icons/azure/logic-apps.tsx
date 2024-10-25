// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgLogicApps = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={9} x2={9} y1={1.796} y2={6.371} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#9cebff" />
        <stop offset={1} stopColor="#50e6ff" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={3.374} x2={3.374} y1={12.14} y2={18.457} gradientUnits="userSpaceOnUse">
        <stop offset={0.001} stopColor="#b4ec36" />
        <stop offset={1} stopColor="#86d633" />
      </linearGradient>
      <linearGradient
        id={`c-${suffix}`}
        x1={14.626}
        x2={14.626}
        y1={12.14}
        y2={18.457}
        gradientTransform="rotate(-90 14.627 14.646)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0.001} stopColor="#b4ec36" />
        <stop offset={1} stopColor="#86d633" />
      </linearGradient>
    </defs>
    <path
      fill="#0078d4"
      d="M13.851 9.047h-2.912a1.52 1.52 0 0 1-1.518-1.518V4.33h-.842v3.2a1.52 1.52 0 0 1-1.518 1.517H4.149a1.2 1.2 0 0 0-1.2 1.2v2.338h.841v-2.341a.355.355 0 0 1 .356-.355h2.915A2.35 2.35 0 0 0 8.8 9.125a.28.28 0 0 1 .408 0 2.35 2.35 0 0 0 1.735.764h2.912a.354.354 0 0 1 .355.355v2.338h.841v-2.338a1.2 1.2 0 0 0-1.2-1.197"
    />
    <rect width={6.747} height={6.747} x={5.626} y={-0.02} fill={`url(#a-${suffix})`} rx={0.604} />
    <rect width={6.747} height={6.747} y={11.273} fill={`url(#b-${suffix})`} rx={0.604} />
    <rect
      width={6.747}
      height={6.747}
      x={11.253}
      y={11.273}
      fill={`url(#c-${suffix})`}
      rx={0.604}
      transform="rotate(90 14.627 14.647)"
    />
  </svg>
)}
export default SvgLogicApps
