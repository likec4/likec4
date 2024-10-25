// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgEventGridDomains = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient
        id={`a-${suffix}`}
        x1={4589.72}
        x2={4589.72}
        y1={-5180.02}
        y2={-5184.21}
        gradientTransform="matrix(.5 0 0 -.5 -2275.31 -2589.32)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#c69aeb" />
        <stop offset={1} stopColor="#6f4bb2" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={4587.99} x2={4587.99} y1={-5188.47} y2={-5192.65} href={`#a-${suffix}`} />
    </defs>
    <path
      fill="#32bedd"
      d="M12.7 8.15v-.6H8.18L6.06 9.66H4.5L8.12 6h2.47v-.57H7.87L3.65 9.66h-.6v.6h1.81L7 12.37h5.1v-.6H7.22l-1.51-1.51h3.67v-.6H6.92l1.5-1.51Z"
    />
    <circle cx={9.98} cy={9.96} r={0.87} fill="#fff" />
    <circle cx={10.89} cy={5.74} r={0.87} fill="#fff" />
    <circle cx={13} cy={7.85} r={0.87} fill="#fff" />
    <circle cx={12.1} cy={12.07} r={0.87} fill="#fff" />
    <circle cx={10.86} cy={5.74} r={1.05} fill="#50e6ff" />
    <circle cx={12.97} cy={7.85} r={1.05} fill={`url(#a-${suffix})`} />
    <circle cx={12.1} cy={12.07} r={1.05} fill={`url(#b-${suffix})`} />
    <circle cx={9.98} cy={9.96} r={1.05} fill="#50e6ff" />
    <g fill="#999">
      <path d="M1.07 1.43h1.29V5a.29.29 0 0 1-.29.29H.79A.29.29 0 0 1 .5 5V2a.57.57 0 0 1 .57-.57" />
      <path d="M1.07 1.43h1.29V5a.29.29 0 0 1-.29.29H.79A.29.29 0 0 1 .5 5V2a.57.57 0 0 1 .57-.57" opacity={0.5} />
    </g>
    <g fill="#999">
      <path d="M15.64 1.43h1.29a.57.57 0 0 1 .57.57v3a.29.29 0 0 1-.29.29h-1.29a.29.29 0 0 1-.28-.29z" />
      <path d="M15.64 1.43h1.29a.57.57 0 0 1 .57.57v3a.29.29 0 0 1-.29.29h-1.29a.29.29 0 0 1-.28-.29z" opacity={0.5} />
    </g>
    <path fill="#949494" d="M17.5 2v1.25H.5V2a.57.57 0 0 1 .57-.57h15.87a.57.57 0 0 1 .56.57" />
    <g fill="#999">
      <path d="M.79 12.68h1.29a.29.29 0 0 1 .29.29v3.6h-1.3A.57.57 0 0 1 .5 16v-3a.29.29 0 0 1 .29-.32" />
      <path d="M.79 12.68h1.29a.29.29 0 0 1 .29.29v3.6h-1.3A.57.57 0 0 1 .5 16v-3a.29.29 0 0 1 .29-.32" opacity={0.5} />
    </g>
    <g fill="#999">
      <path d="M15.92 12.68h1.29a.29.29 0 0 1 .29.29v3a.57.57 0 0 1-.57.57h-1.29V13a.29.29 0 0 1 .28-.32" />
      <path
        d="M15.92 12.68h1.29a.29.29 0 0 1 .29.29v3a.57.57 0 0 1-.57.57h-1.29V13a.29.29 0 0 1 .28-.32"
        opacity={0.5}
      />
    </g>
    <path fill="#949494" d="M.5 16v-1.25h17V16a.57.57 0 0 1-.57.57H1.07A.57.57 0 0 1 .5 16" />
  </svg>
)}
export default SvgEventGridDomains
