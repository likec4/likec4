// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgVmAppDefinitions = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient
        id={`a-${suffix}`}
        x1={-555}
        x2={-555}
        y1={1012.831}
        y2={1024.831}
        gradientTransform="matrix(1 0 0 -1 564 1025.516)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#0078d4" />
        <stop offset={0.82} stopColor="#5ea0ef" />
      </linearGradient>
      <linearGradient
        id={`b-${suffix}`}
        x1={-554.99}
        x2={-554.99}
        y1={1008.201}
        y2={1012.831}
        gradientTransform="matrix(1 0 0 -1 564 1025.516)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#1490df" />
        <stop offset={0.98} stopColor="#1f56a3" />
      </linearGradient>
    </defs>
    <rect width={18} height={12} y={0.685} fill={`url(#a-${suffix})`} rx={0.6} />
    <path
      fill={`url(#b-${suffix})`}
      d="M12.61 16.315c-1.78-.28-1.85-1.56-1.84-3.63H7.2c0 2.07 0 3.35-1.81 3.63a1 1 0 0 0-.88 1h9a1.06 1.06 0 0 0-.9-1"
    />
    <g data-name="b60cdf7c-998d-4b07-83eb-3c17ec41d74f">
      <rect width={2.793} height={2.793} x={7.304} y={5.7} fill="#9cebff" rx={0.11} />
      <path
        fill="#773adc"
        d="M11.864 3.73H9.225a.11.11 0 0 0-.109.108v.48a.11.11 0 0 0 .109.109h1.941a.22.22 0 0 1 .219.218v1.974a.11.11 0 0 0 .108.108h.481a.11.11 0 0 0 .109-.108v-2.67a.22.22 0 0 0-.219-.219"
      />
      <path
        fill="#fff"
        d="M10.938 7.187v1.737a.2.2 0 0 1-.2.2H6.772a.2.2 0 0 1-.2-.2V5.18a.2.2 0 0 1 .2-.2h1.989a.11.11 0 0 0 .108-.109v-.416a.11.11 0 0 0-.108-.109H6.137a.2.2 0 0 0-.2.2V9.56a.2.2 0 0 0 .2.2h5.237a.2.2 0 0 0 .2-.2V7.187a.11.11 0 0 0-.109-.109h-.418a.11.11 0 0 0-.109.108Z"
      />
    </g>
  </svg>
)}
export default SvgVmAppDefinitions
