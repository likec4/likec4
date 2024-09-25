// @ts-nocheck

import type { SVGProps } from 'react'
const SvgInformation = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id="a" x1={8.56} x2={8.56} y1={17.59} y2={0.59} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#1988d9" />
        <stop offset={0.22} stopColor="#218ddc" />
        <stop offset={0.56} stopColor="#379ce5" />
        <stop offset={0.9} stopColor="#54aef0" />
      </linearGradient>
    </defs>
    <path fill="url(#a)" d="M13.77 15.81A8.5 8.5 0 0 1 3.35 2.37l.09-.06a8.5 8.5 0 0 1 10.33 13.5" />
    <path
      fill="#fff"
      d="M8.56 6.17a1.24 1.24 0 0 1-.89-.33 1 1 0 0 1-.34-.79 1 1 0 0 1 .34-.79A1.3 1.3 0 0 1 8.56 4a1.28 1.28 0 0 1 .89.3 1 1 0 0 1 .35.79 1 1 0 0 1-.35.8 1.24 1.24 0 0 1-.89.28m.64 8.05H7.89a.42.42 0 0 1-.42-.42V7.69a.42.42 0 0 1 .42-.42H9.2a.42.42 0 0 1 .42.42v6.11a.42.42 0 0 1-.42.42"
    />
  </svg>
)
export default SvgInformation
