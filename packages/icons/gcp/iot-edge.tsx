// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgIotEdge = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <defs>
      <clipPath id={`clip-path-${suffix}`}>
        <path d="M18 11v2h3a1 1 0 0 0 1-1 1 1 0 0 0-1-1Z" fill="#2683fb" clipRule="evenodd" />
      </clipPath>
      <clipPath id={`clip-path-2-${suffix}`}>
        <path d="M0 0h24v24H0z" className="cls-2" />
      </clipPath>
      <clipPath id={`clip-path-3-${suffix}`}>
        <path
          d="M2 8v1h9.46a1 1 0 0 1 .84.45l1.33 2a1 1 0 0 1 0 1.11l-1.33 2a1 1 0 0 1-.84.45H2v1a1 1 0 0 0 1 1h9.46a1 1 0 0 0 .84-.45L15 14h2a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-2l-1.7-2.55a1 1 0 0 0-.84-.45H3a1 1 0 0 0-1 1"
          clipRule="evenodd"
          fill="#a6cafd"
        />
      </clipPath>
      <clipPath id={`clip-path-4-${suffix}`}>
        <path d="M0 0h24v24H0z" className="cls-4" />
      </clipPath>
      <clipPath id={`clip-path-5-${suffix}`}>
        <path
          d="M15 18h-3.46a1 1 0 0 1-.84-.45L8 13.45a1 1 0 0 0-.87-.45H2v2h2v-1h1.46a1 1 0 0 1 .84.45l3.4 5.1a1 1 0 0 0 .84.45H16a1 1 0 0 0 1-1v-2h4a1 1 0 0 0 1-1 1 1 0 0 0-1-1h-5a1 1 0 0 0-1 1Z"
          className="cls-5"
        />
      </clipPath>
      <clipPath id={`clip-path-6-${suffix}`}>
        <path d="M0 0h24v24H0z" className="cls-6" />
      </clipPath>
      <clipPath id={`clip-path-7-${suffix}`}>
        <path
          d="M17 7V5a1 1 0 0 0-1-1h-5.46a1 1 0 0 0-.84.45l-3.4 5.1a1 1 0 0 1-.84.45H4V9H2v2h5.13a1 1 0 0 0 .87-.45l2.74-4.1a1 1 0 0 1 .8-.45H15v2a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1 1 1 0 0 0-1-1Z"
          className="cls-5"
        />
      </clipPath>
      <clipPath id={`clip-path-9-${suffix}`}>
        <circle cx={10.5} cy={12} r={1.25} className="cls-2" />
      </clipPath>
      <style>
        {'.cls-2{fill:#2683fb}.cls-5{clip-rule:evenodd}.cls-4{fill:#a6cafd}.cls-14,.cls-5,.cls-6{fill:#559cfc}.cls-14{fill-rule:evenodd}.cls-10{clip-path:url(#clip-path-2)}.cls-16{clip-path:url(#clip-path-6)}'}
      </style>
    </defs>
    <g data-name="Product Icons">
      <g data-name="colored-32/cloud-iot-edge">
        <path id={`Rectangle-${suffix}`} d="M0 0h24v24H0z" fill="none" />
      </g>
      <path d="M18 11v2h3a1 1 0 0 0 1-1 1 1 0 0 0-1-1Z" fill="#2683fb" fillRule="evenodd" />
      <g clipPath={`url(#clip-path-${suffix})`}>
        <path d="M0 0h24v24H0z" className="cls-2" />
        <g className="cls-10">
          <path d="M14 6h13v12H14z" className="cls-2" />
        </g>
      </g>
      <path
        d="M2 8v1h9.46a1 1 0 0 1 .84.45l1.33 2a1 1 0 0 1 0 1.11l-1.33 2a1 1 0 0 1-.84.45H2v1a1 1 0 0 0 1 1h9.46a1 1 0 0 0 .84-.45L15 14h2a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-2l-1.7-2.55a1 1 0 0 0-.84-.45H3a1 1 0 0 0-1 1"
        fill="#a6cafd"
        fillRule="evenodd"
      />
      <g clipPath={`url(#clip-path-3-${suffix})`}>
        <path d="M0 0h24v24H0z" className="cls-4" />
        <path d="M-3 2h27v20H-3z" className="cls-4" clipPath={`url(#clip-path-4-${suffix})`} />
      </g>
      <path
        d="M15 18h-3.46a1 1 0 0 1-.84-.45L8 13.45a1 1 0 0 0-.87-.45H2v2h2v-1h1.46a1 1 0 0 1 .84.45l3.4 5.1a1 1 0 0 0 .84.45H16a1 1 0 0 0 1-1v-2h4a1 1 0 0 0 1-1 1 1 0 0 0-1-1h-5a1 1 0 0 0-1 1Z"
        className="cls-14"
      />
      <g clipPath={`url(#clip-path-5-${suffix})`}>
        <path d="M0 0h24v24H0z" className="cls-6" />
        <g className="cls-16">
          <path d="M-3 8h30v17H-3z" className="cls-6" />
        </g>
      </g>
      <path
        d="M17 7V5a1 1 0 0 0-1-1h-5.46a1 1 0 0 0-.84.45l-3.4 5.1a1 1 0 0 1-.84.45H4V9H2v2h5.13a1 1 0 0 0 .87-.45l2.74-4.1a1 1 0 0 1 .8-.45H15v2a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1 1 1 0 0 0-1-1Z"
        className="cls-14"
      />
      <g clipPath={`url(#clip-path-7-${suffix})`}>
        <path d="M0 0h24v24H0z" className="cls-6" />
        <g className="cls-16">
          <path d="M-3-1h30v17H-3z" className="cls-6" />
        </g>
      </g>
      <circle cx={10.5} cy={12} r={1.25} className="cls-2" />
      <g clipPath={`url(#clip-path-9-${suffix})`}>
        <path d="M0 0h24v24H0z" className="cls-2" />
        <g className="cls-10">
          <path d="M4.25 5.75h12.5v12.5H4.25z" className="cls-2" />
        </g>
      </g>
      <rect width={6.52} height={2} x={2} y={18} className="cls-2" rx={0.97} />
      <rect width={6.52} height={2} x={2} y={4} className="cls-2" rx={0.97} />
    </g>
  </svg>
)}
export default SvgIotEdge
