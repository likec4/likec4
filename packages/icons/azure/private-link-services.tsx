// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgPrivateLinkServices = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient
        id={`a-${suffix}`}
        x1={7.688}
        x2={7.688}
        y1={-26.771}
        y2={-21.482}
        gradientTransform="translate(0 32)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0.23} stopColor="#5ea0ef" />
        <stop offset={0.32} stopColor="#5b9fee" />
        <stop offset={0.48} stopColor="#509aeb" />
        <stop offset={0.57} stopColor="#3f92e6" />
        <stop offset={0.75} stopColor="#2688df" />
        <stop offset={0.93} stopColor="#127fd9" />
      </linearGradient>
      <linearGradient
        id={`b-${suffix}`}
        x1={10.312}
        x2={10.312}
        y1={-24.568}
        y2={-19.279}
        gradientTransform="translate(0 32)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0.2} stopColor="#50e6ff" />
        <stop offset={0.65} stopColor="#32bedd" />
        <stop offset={1} stopColor="#198ab3" />
      </linearGradient>
      <linearGradient id={`c-${suffix}`} x1={9} x2={9} y1={5.38} gradientUnits="userSpaceOnUse">
        <stop offset={0.199} stopColor="#005ba1" />
        <stop offset={1} stopColor="#0078d4" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M8.736 5.229H6.62a2.644 2.644 0 0 0-.41 5.253 2.8 2.8 0 0 1 .027-.982 1.67 1.67 0 0 1 .383-3.3h2.116a1.675 1.675 0 0 1 0 3.35h-.582a1.3 1.3 0 0 0-.124.529 1.2 1.2 0 0 0 .084.441h.622a2.645 2.645 0 0 0 0-5.289Z"
    />
    <path
      fill={`url(#b-${suffix})`}
      d="M11.79 7.468a3 3 0 0 1 .031.405 2.7 2.7 0 0 1-.058.577 1.671 1.671 0 0 1-.383 3.3H9.264a1.675 1.675 0 0 1 0-3.35h.582a1.2 1.2 0 0 0 .04-.97h-.622a2.645 2.645 0 0 0 0 5.289h2.116a2.644 2.644 0 0 0 .41-5.253Z"
    />
    <path
      fill="#0078d4"
      d="m9-.025-7.85 4.49v8.97L9 17.975l7.85-4.49v-9Zm6.4 12.57-6.4 3.7-6.4-3.661V5.355l6.4-3.7 6.4 3.71Z"
    />
    <path fill={`url(#c-${suffix})`} d="M9 0 1.15 4.49l1.45.89L9 1.68l6.4 3.7 1.45-.89z" />
  </svg>
)}
export default SvgPrivateLinkServices
