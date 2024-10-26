// @ts-nocheck

import type { SVGProps } from 'react'
const SvgDefenderHmi = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18" {...props}>
    <path
      fill="#0078D4"
      d="M.876 3.504C1.168 2.58 1.941 2 2.784 2h12.34c.862 0 1.647.607 1.934 1.557 1.285 4.246 1.224 7.043.01 10.913-.293.935-1.073 1.53-1.926 1.53H2.868c-.885 0-1.685-.64-1.96-1.621C-.274 10.163-.32 7.298.876 3.504"
    />
    <g clipPath="url(#Defender-HMI_svg__a)">
      <path fill="#fff" d="M14 14.889a1.889 1.889 0 1 0 0-3.778 1.889 1.889 0 0 0 0 3.778" />
      <path
        fill="#00188F"
        fillRule="evenodd"
        d="M15.402 11.734a2 2 0 0 0-.28-.254l-1.219 1.4.269.27z"
        clipRule="evenodd"
      />
    </g>
    <circle cx={8.544} cy={13.544} r={0.544} fill="#fff" />
    <circle cx={6.544} cy={13.544} r={0.544} fill="#fff" />
    <rect width={3} height={1} x={2.041} y={13.134} fill="#fff" rx={0.5} />
    <path
      fill="url(#Defender-HMI_svg__b)"
      d="M2.412 4.041c0-.205.167-.37.371-.37h12.433c.205 0 .372.165.372.37v5.196a.37.37 0 0 1-.371.371H2.783a.37.37 0 0 1-.37-.37z"
    />
    <defs>
      <linearGradient
        id="Defender-HMI_svg__b"
        x1={2.412}
        x2={15.588}
        y1={6.639}
        y2={6.639}
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#5EA0EF" />
        <stop offset={1} stopColor="#83B9F9" />
      </linearGradient>
      <clipPath id="Defender-HMI_svg__a">
        <path fill="#fff" d="M12 11h4v4h-4z" />
      </clipPath>
    </defs>
  </svg>
)
export default SvgDefenderHmi
