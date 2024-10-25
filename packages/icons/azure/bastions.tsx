// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgBastions = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient
        id={`a-${suffix}`}
        x1={12.896}
        x2={12.896}
        y1={-0.54}
        y2={6.922}
        gradientTransform="rotate(-44.919 12.821 3.813)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#5ea0ef" />
        <stop offset={1} stopColor="#0078d4" />
      </linearGradient>
      <linearGradient
        id={`b-${suffix}`}
        x1={5.104}
        x2={5.104}
        y1={5.035}
        y2={12.497}
        gradientTransform="rotate(-135.081 5.179 8.795)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#5ea0ef" />
        <stop offset={1} stopColor="#0078d4" />
      </linearGradient>
    </defs>
    <path
      fill="#83b9f9"
      d="m16.637 12.107-.802.805a.363.363 0 0 1-.513 0L9.387 6.994a.727.727 0 0 1-.002-1.028l.802-.805 6.45 6.432a.363.363 0 0 1 0 .514"
    />
    <path
      fill={`url(#a-${suffix})`}
      d="M12.253-.856h1.136a.363.363 0 0 1 .363.363v8.976h-1.136a.727.727 0 0 1-.727-.727V-.492a.363.363 0 0 1 .363-.363Z"
      transform="rotate(44.919 12.821 3.813)"
    />
    <path
      fill="#83b9f9"
      d="m7.813 10.143.802.805a.727.727 0 0 1-.002 1.028l-5.935 5.918a.363.363 0 0 1-.513 0l-.803-.805a.363.363 0 0 1 0-.514z"
    />
    <path
      fill={`url(#b-${suffix})`}
      d="M4.974 4.126H6.11V13.1a.363.363 0 0 1-.363.363H4.611a.363.363 0 0 1-.363-.363V4.852a.727.727 0 0 1 .727-.727Z"
      transform="rotate(135.081 5.179 8.795)"
    />
  </svg>
)}
export default SvgBastions
