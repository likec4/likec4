// @ts-nocheck

import type { SVGProps } from 'react'
const SvgVersions = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id="a" x1={7.849} x2={7.849} y1={12.323} y2={4.229} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#0078d4" />
        <stop offset={0.502} stopColor="#4093e6" />
        <stop offset={0.775} stopColor="#5ea0ef" />
      </linearGradient>
      <linearGradient id="b" x1={10.151} x2={10.151} y1={16.69} y2={8.595} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#32bedd" />
        <stop offset={0.175} stopColor="#32caea" />
        <stop offset={0.41} stopColor="#32d2f2" />
        <stop offset={0.775} stopColor="#32d4f5" />
      </linearGradient>
    </defs>
    <path fill="url(#a)" d="M1 4.229h13.7v7.637a.46.46 0 0 1-.458.458H1.458A.46.46 0 0 1 1 11.866z" />
    <path fill="#0078d4" d="M1.46 1.31h12.777a.46.46 0 0 1 .458.458v2.461H1V1.768a.46.46 0 0 1 .46-.458" />
    <path fill="url(#b)" d="M3.3 8.6H17v7.637a.46.46 0 0 1-.458.458H3.76a.46.46 0 0 1-.458-.458V8.6z" />
    <path fill="#198ab3" d="M3.763 5.677H16.54a.46.46 0 0 1 .46.457V8.6H3.3V6.134a.46.46 0 0 1 .463-.457" />
  </svg>
)
export default SvgVersions
