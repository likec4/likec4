// @ts-nocheck

import type { SVGProps } from 'react'
const SvgAzureSphere = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id="Azure-Sphere_svg__a" x1={9} x2={9} y1={17.826} y2={0.826} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#198ab3" />
        <stop offset={0.442} stopColor="#28b7db" />
        <stop offset={0.775} stopColor="#32d4f5" />
      </linearGradient>
      <linearGradient
        id="Azure-Sphere_svg__b"
        x1={5.75}
        x2={12.303}
        y1={-3114.591}
        y2={-3119.908}
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#fff" stopOpacity={0.9} />
        <stop offset={1} stopColor="#fff" stopOpacity={0.8} />
      </linearGradient>
    </defs>
    <circle cx={9} cy={9.326} r={8.5} fill="url(#Azure-Sphere_svg__a)" />
    <path
      fill="url(#Azure-Sphere_svg__b)"
      d="M8.81 15.067c-.973-.6-4.151-2.747-4.151-5.255V6.605L5 6.584a4.04 4.04 0 0 0 2.35-.742A2.48 2.48 0 0 1 9 5.353a2.5 2.5 0 0 1 1.648.487A4.05 4.05 0 0 0 13 6.584l.34.021v3.207c0 2.508-3.178 4.656-4.152 5.255L9 15.183Z"
    />
    <path
      fill="#50e6ff"
      d="M9 14.643C7.114 13.472 5.119 11.6 5.119 9.812V7.037a4.45 4.45 0 0 0 2.486-.812A2.03 2.03 0 0 1 9 5.813a2.07 2.07 0 0 1 1.394.411 4.46 4.46 0 0 0 2.487.813v2.775c0 1.788-1.995 3.66-3.881 4.831"
    />
    <circle cx={15.345} cy={14.083} r={1.302} fill="#fff" />
    <path
      fill="#b3b3b3"
      d="M15.345 12.781a1.3 1.3 0 1 1-1.3 1.3 1.3 1.3 0 0 1 1.3-1.3m0-.651a1.954 1.954 0 1 0 1.955 1.953 1.956 1.956 0 0 0-1.953-1.953Z"
    />
    <circle cx={2.655} cy={14.083} r={1.302} fill="#fff" />
    <path
      fill="#b3b3b3"
      d="M2.655 12.781a1.3 1.3 0 1 1-1.3 1.3 1.3 1.3 0 0 1 1.3-1.3m0-.651a1.954 1.954 0 1 0 1.953 1.953 1.955 1.955 0 0 0-1.953-1.953"
    />
    <circle cx={9} cy={2.128} r={1.302} fill="#fff" />
    <path
      fill="#b3b3b3"
      d="M9 .826a1.3 1.3 0 1 1-1.3 1.3A1.3 1.3 0 0 1 9 .826m0-.652a1.954 1.954 0 1 0 1.953 1.954A1.956 1.956 0 0 0 9 .174"
    />
  </svg>
)
export default SvgAzureSphere
