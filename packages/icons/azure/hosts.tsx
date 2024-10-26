// @ts-nocheck

import type { SVGProps } from 'react'
const SvgHosts = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id="Hosts_svg__a" x1={9.02} x2={9.02} y1={5.46} y2={0.65} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#198ab3" />
        <stop offset={1} stopColor="#32d4f5" />
      </linearGradient>
      <linearGradient id="Hosts_svg__b" x1={8.98} x2={8.98} y1={11.97} y2={7.17} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#198ab3" />
        <stop offset={1} stopColor="#32d4f5" />
      </linearGradient>
      <linearGradient id="Hosts_svg__c" x1={9.02} x2={9.02} y1={17.34} y2={14.32} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#198ab3" />
        <stop offset={1} stopColor="#32d4f5" />
      </linearGradient>
    </defs>
    <path fill="#32bedd" d="M8.46 5.46h1v9.6h-1Z" />
    <path
      fill="url(#Hosts_svg__a)"
      d="M15.48.65H2.56a.58.58 0 0 0-.56.58v3.65a.58.58 0 0 0 .57.58h12.91a.57.57 0 0 0 .57-.58V1.23a.57.57 0 0 0-.57-.58"
    />
    <path
      fill="url(#Hosts_svg__b)"
      d="M15.44 7.17H2.52a.57.57 0 0 0-.52.57v3.66a.56.56 0 0 0 .57.57h12.87a.57.57 0 0 0 .56-.57V7.74a.58.58 0 0 0-.56-.57"
    />
    <circle cx={9.06} cy={15.84} r={1.51} fill="#7fba00" />
    <circle cx={9.02} cy={15.83} r={1.51} fill="url(#Hosts_svg__c)" />
    <g fill="#b4ec36">
      <rect width={1.05} height={1.05} x={13.72} y={1.55} rx={0.15} />
      <rect width={1.05} height={1.05} x={13.72} y={3.36} rx={0.15} />
    </g>
    <g fill="#b4ec36">
      <rect width={1.05} height={1.05} x={13.72} y={8.04} rx={0.15} />
      <rect width={1.05} height={1.05} x={13.72} y={9.85} rx={0.15} />
    </g>
  </svg>
)
export default SvgHosts
