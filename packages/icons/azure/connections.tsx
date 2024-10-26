// @ts-nocheck

import type { SVGProps } from 'react'
const SvgConnections = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <clipPath id="Connections_svg__b">
        <path
          fill="none"
          d="M10.58 8.34 13 10.92a.22.22 0 0 1 0 .3l-.47.49a.2.2 0 0 1-.3 0L9 8.34A.22.22 0 0 1 9 8l3.15-3.32a.2.2 0 0 1 .3 0l.47.49a.23.23 0 0 1 0 .31L10.58 8a.22.22 0 0 0 0 .34"
        />
      </clipPath>
      <clipPath id="Connections_svg__c">
        <path
          fill="none"
          d="m7.11 9.91-2.43 2.57a.23.23 0 0 0 0 .31l.47.49a.2.2 0 0 0 .3 0l3.2-3.37a.22.22 0 0 0 0-.3L5.5 6.29a.2.2 0 0 0-.3 0l-.47.49a.22.22 0 0 0 0 .3l2.38 2.53a.2.2 0 0 1 0 .3"
        />
      </clipPath>
      <radialGradient
        id="Connections_svg__a"
        cx={46.42}
        cy={43.21}
        r={9}
        gradientTransform="matrix(.94 0 0 .94 -34.84 -31.81)"
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
    </defs>
    <circle cx={9} cy={9} r={8.5} fill="url(#Connections_svg__a)" />
    <circle cx={9} cy={9} r={7.4} fill="#fff" />
    <g clipPath="url(#Connections_svg__b)">
      <path fill="#5e9624" d="m10.43 8.19 2.73 2.88-.77.8-3.5-3.68 3.45-3.63.77.8z" />
      <path fill="#86d633" d="m13.16 11.07-2.73-2.88-.76.8 2.72 2.88z" />
    </g>
    <g clipPath="url(#Connections_svg__c)">
      <path fill="#5e9624" d="m7.26 9.76-2.72 2.88.76.8 3.5-3.68-3.45-3.63-.77.8z" />
      <path fill="#86d633" d="m4.54 12.64 2.72-2.88.76.8-2.72 2.88z" />
    </g>
  </svg>
)
export default SvgConnections
