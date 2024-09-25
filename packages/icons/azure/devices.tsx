// @ts-nocheck

import type { SVGProps } from 'react'
const SvgDevices = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id="a" x1={8.34} x2={8.34} y1={11.96} y2={1.86} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#d2ebff" />
        <stop offset={1} stopColor="#f0fffd" />
      </linearGradient>
      <linearGradient id="b" x1={14.15} x2={14.15} y1={20.41} y2={2.34} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#0078d4" />
        <stop offset={0.17} stopColor="#1c84dc" />
        <stop offset={0.38} stopColor="#3990e4" />
        <stop offset={0.59} stopColor="#4d99ea" />
        <stop offset={0.8} stopColor="#5a9eee" />
        <stop offset={1} stopColor="#5ea0ef" />
      </linearGradient>
      <linearGradient id="c" x1={14.15} x2={14.15} y1={15.53} y2={5.2} href="#a" />
    </defs>
    <rect width={16.68} height={11.87} y={1.03} fill="#0078d4" rx={0.6} />
    <rect width={14.74} height={10.1} x={0.97} y={1.86} fill="url(#a)" opacity={0.9} rx={0.3} />
    <rect width={7.7} height={12.85} x={10.3} y={4.12} fill="url(#b)" rx={0.3} />
    <rect width={1.77} height={0.24} x={13.27} y={4.55} fill="#f2f2f2" rx={0.11} />
    <rect width={6.25} height={10.33} x={11.03} y={5.2} fill="url(#c)" opacity={0.9} rx={0.14} />
    <rect width={1.77} height={0.24} x={7.48} y={1.4} fill="#f2f2f2" rx={0.11} />
    <rect width={0.86} height={0.73} x={13.72} y={15.96} fill="#f2f2f2" rx={0.2} />
  </svg>
)
export default SvgDevices
