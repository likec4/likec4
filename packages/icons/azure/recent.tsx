// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgRecent = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <radialGradient
        id={`a-${suffix}`}
        cx={-7.55}
        cy={17.42}
        r={9}
        gradientTransform="matrix(.94 0 0 .94 16.02 -7.37)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0.18} stopColor="#5ea0ef" />
        <stop offset={0.56} stopColor="#5c9fee" />
        <stop offset={0.69} stopColor="#559ced" />
        <stop offset={0.78} stopColor="#4a97e9" />
        <stop offset={0.86} stopColor="#3990e4" />
        <stop offset={0.93} stopColor="#2387de" />
        <stop offset={0.99} stopColor="#087bd6" />
        <stop offset={1} stopColor="#0078d4" />
      </radialGradient>
      <radialGradient
        id={`b-${suffix}`}
        cx={-7.17}
        cy={18.5}
        r={1.26}
        gradientTransform="matrix(.94 0 0 .94 15.68 -8.34)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#7f7f7f" />
        <stop offset={1} stopColor="#5e5e5e" />
      </radialGradient>
    </defs>
    <circle cx={8.88} cy={9.09} r={8.5} fill={`url(#a-${suffix})`} />
    <circle cx={8.92} cy={9.09} r={7.4} fill="#fff" />
    <path
      fill="#7a7a7a"
      d="m12.347 5.348.898-.898.29.29-.898.898zM13.93 8.88h1.27v.41h-1.27zM12.288 12.756l.29-.29.898.898-.29.29zM8.71 14.08h.41v1.27h-.41zM4.251 4.7l.29-.29.898.897-.29.29zM4.314 13.395l.898-.898.29.29-.898.898zM2.55 8.88h1.27v.41H2.55z"
    />
    <rect width={1.14} height={6.52} x={8.4} y={2.83} fill="#7a7a7a" rx={0.52} />
    <rect width={1.14} height={4.08} x={9.92} y={8.65} fill="#7a7a7a" rx={0.52} transform="rotate(135 10.494 10.685)" />
    <circle cx={8.92} cy={9.08} r={1.2} fill={`url(#b-${suffix})`} />
  </svg>
)}
export default SvgRecent
