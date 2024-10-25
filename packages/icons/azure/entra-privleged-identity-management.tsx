// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgEntraPrivlegedIdentityManagement = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient
        id={`a-${suffix}`}
        x1={-85}
        x2={-85}
        y1={777.516}
        y2={795.516}
        gradientTransform="matrix(1 0 0 -1 94 795.516)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#773adc" />
        <stop offset={0.82} stopColor="#a67af4" />
      </linearGradient>
      <linearGradient
        id={`b-${suffix}`}
        x1={7.996}
        x2={12.911}
        y1={779.969}
        y2={785.714}
        gradientTransform="matrix(1 0 0 -1 0 791.516)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#225086" />
        <stop offset={1} stopColor="#0055c5" />
      </linearGradient>
      <linearGradient
        id={`c-${suffix}`}
        x1={9}
        x2={9}
        y1={777.497}
        y2={792.036}
        gradientTransform="matrix(1 0 0 -1 0 791.516)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#44dbf9" />
        <stop offset={1} stopColor="#cbf8ff" />
      </linearGradient>
      <linearGradient
        id={`d-${suffix}`}
        x1={6.97}
        x2={6.97}
        y1={779.196}
        y2={791.703}
        gradientTransform="matrix(1 0 0 -1 0 791.516)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#6df" />
        <stop offset={1} stopColor="#0294e4" />
      </linearGradient>
      <linearGradient
        id={`e-${suffix}`}
        x1={12.463}
        x2={12.463}
        y1={776.546}
        y2={788.909}
        gradientTransform="matrix(1 0 0 -1 0 791.516)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#041642" />
        <stop offset={1} stopColor="#041642" stopOpacity={0.25} />
      </linearGradient>
    </defs>
    <circle cx={9} cy={9} r={9} fill={`url(#a-${suffix})`} />
    <path
      fill={`url(#b-${suffix})`}
      d="M15.655 9.667 9.882 3.155a1.195 1.195 0 0 0-1.766 0L2.343 9.667c-.446.503-.329 1.263.249 1.625l5.773 3.609c.385.241.884.241 1.269 0l5.773-3.609a1.066 1.066 0 0 0 .249-1.625Z"
    />
    <path fill={`url(#c-${suffix})`} d="m5.64 9.845.04.025L9 11.945l3.359-2.1h.001-.001L9 6.055z" />
    <path
      fill={`url(#d-${suffix})`}
      d="M9.883 3.154a1.195 1.195 0 0 0-1.766 0L2.344 9.666c-.446.503-.329 1.263.249 1.625l2.406 1.504c.299.186.795.393 1.32.393.478 0 .921-.139 1.29-.375h.002L9 11.945l-3.359-2.1L9.085 5.96a2.35 2.35 0 0 1 1.772-.79c.363 0 .706.082 1.012.225L9.884 3.156v-.002Z"
    />
    <path
      fill={`url(#e-${suffix})`}
      fillOpacity={0.5}
      d="M9 15.081c.221 0 .442-.06.634-.18l5.773-3.609a1.066 1.066 0 0 0 .249-1.625L9.883 3.155A1.18 1.18 0 0 0 9 2.765v12.317Z"
      opacity={0.5}
    />
  </svg>
)}
export default SvgEntraPrivlegedIdentityManagement
