// @ts-nocheck

import type { SVGProps } from 'react'
const SvgScheduler = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <radialGradient
        id="Scheduler_svg__a"
        cx={16.858}
        cy={14.328}
        r={8.737}
        gradientTransform="translate(-6.212 -5.281)scale(.944)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0.183} stopColor="#5ea0ef" />
        <stop offset={0.555} stopColor="#5c9fee" />
        <stop offset={0.689} stopColor="#559ced" />
        <stop offset={0.785} stopColor="#4a97e9" />
        <stop offset={0.862} stopColor="#3990e4" />
        <stop offset={0.928} stopColor="#2387de" />
        <stop offset={0.985} stopColor="#087bd6" />
        <stop offset={1} stopColor="#0078d4" />
      </radialGradient>
      <radialGradient
        id="Scheduler_svg__b"
        cx={17.97}
        cy={15.337}
        r={1.223}
        gradientTransform="translate(-7.203 -6.199)scale(.943)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#7f7f7f" />
        <stop offset={1} stopColor="#5e5e5e" />
      </radialGradient>
    </defs>
    <circle cx={9.71} cy={8.252} r={8.252} fill="url(#Scheduler_svg__a)" />
    <circle cx={9.742} cy={8.252} r={7.185} fill="#fff" />
    <path
      fill="#7a7a7a"
      d="m13.08 4.624.87-.87.281.28-.87.87zM14.61 8.045h1.231v.397H14.61zM13.023 11.807l.28-.281.871.87-.28.281zM9.543 13.093h.397v1.231h-.397zM5.211 3.995l.28-.281.871.87-.28.281zM5.271 12.432l.87-.87.281.28-.87.871zM3.565 8.045h1.231v.397H3.565z"
    />
    <rect width={1.107} height={6.326} x={9.237} y={2.172} fill="#7a7a7a" rx={0.505} />
    <rect
      width={1.105}
      height={3.961}
      x={10.722}
      y={7.822}
      fill="#7a7a7a"
      rx={0.504}
      transform="rotate(135 11.274 9.802)"
    />
    <circle cx={9.747} cy={8.238} r={1.169} fill="url(#Scheduler_svg__b)" />
    <path
      fill="#86d633"
      d="M8.078.146A8.294 8.294 0 0 0 5.4 15.353l.274-.726a.161.161 0 0 1 .275-.046l2.151 2.61a.161.161 0 0 1-.1.262L4.657 18a.162.162 0 0 1-.177-.216l.4-1.074a9.72 9.72 0 0 1-4.507-5.757A8.462 8.462 0 0 1 8.078.146"
    />
  </svg>
)
export default SvgScheduler
