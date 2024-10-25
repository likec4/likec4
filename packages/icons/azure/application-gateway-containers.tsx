// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgApplicationGatewayContainers = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={9} x2={9} y1={16.285} y2={0.534} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#005ba1" />
        <stop offset={1} stopColor="#0078d4" />
      </linearGradient>
      <linearGradient
        id={`c-${suffix}`}
        x1={-1.246}
        x2={0.764}
        y1={825.736}
        y2={827.746}
        gradientTransform="rotate(-135 -163.511 419.475)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#5ea0ef" />
        <stop offset={1} stopColor="#83b9f9" />
      </linearGradient>
      <linearGradient
        id={`d-${suffix}`}
        x1={-104.431}
        x2={-104.431}
        y1={575.695}
        y2={578.537}
        gradientTransform="rotate(-180 -47.706 292.702)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#5ea0ef" />
        <stop offset={1} stopColor="#83b9f9" />
      </linearGradient>
      <linearGradient
        id={`e-${suffix}`}
        x1={157.457}
        x2={160.3}
        y1={814.945}
        y2={814.945}
        gradientTransform="rotate(-90 -319.362 492.478)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#5ea0ef" />
        <stop offset={1} stopColor="#83b9f9" />
      </linearGradient>
      <linearGradient
        id={`f-${suffix}`}
        x1={157.457}
        x2={160.3}
        y1={441.025}
        y2={441.025}
        gradientTransform="matrix(0 -1 -1 0 455.975 173.116)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#5ea0ef" />
        <stop offset={1} stopColor="#83b9f9" />
      </linearGradient>
      <radialGradient id={`b-${suffix}`} cx={9.009} cy={8.4} r={8.123} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="gray" />
        <stop offset={0.191} stopColor="#a1a1a1" />
        <stop offset={0.402} stopColor="silver" />
        <stop offset={0.521} stopColor="#ccc" />
        <stop offset={0.631} stopColor="#c9c9c9" />
        <stop offset={0.713} stopColor="#bfbfbf" />
        <stop offset={0.785} stopColor="#afafaf" />
        <stop offset={0.852} stopColor="#999" />
        <stop offset={0.908} stopColor="gray" />
      </radialGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M18 8.412a.6.6 0 0 0-.08-.303L13.722.836a.61.61 0 0 0-.525-.303H4.803a.61.61 0 0 0-.525.306L.08 8.103a.61.61 0 0 0 0 .606l4.197 7.27a.61.61 0 0 0 .525.306h8.395a.61.61 0 0 0 .525-.306l4.197-7.264a.6.6 0 0 0 .08-.303"
    />
    <path
      fill={`url(#b-${suffix})`}
      d="M15.367 13.821 9.609 8.063v-.061h-.061l-.111-.11-.11.11h-.585l-.159-.157-5.896 5.979.839.827 4.905-4.974v6.368h1.178V9.729l4.925 4.925z"
    />
    <circle cx={9.02} cy={16.045} r={1.421} fill={`url(#c-${suffix})`} />
    <path
      fill="#fff"
      d="M6.581 8.279a2.449 2.449 0 1 0 3.106-2.343v-1.75a1.5 1.5 0 1 0-1.378 0V5.98a2.43 2.43 0 0 0-1.728 2.299"
    />
    <circle cx={9.02} cy={8.288} r={1.421} fill={`url(#d-${suffix})`} />
    <circle cx={3.106} cy={14.238} r={1.421} fill={`url(#e-${suffix})`} />
    <circle cx={14.951} cy={14.238} r={1.421} fill={`url(#f-${suffix})`} />
  </svg>
)}
export default SvgApplicationGatewayContainers
