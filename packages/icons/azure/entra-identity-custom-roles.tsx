// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgEntraIdentityCustomRoles = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient
        id={`a-${suffix}`}
        x1={-609.26}
        x2={-609.26}
        y1={-224.13}
        y2={-211.218}
        gradientTransform="matrix(1 0 0 -1 617.126 -205.758)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#5e9624" />
        <stop offset={1} stopColor="#b4ec36" />
      </linearGradient>
      <linearGradient
        id={`b-${suffix}`}
        x1={-609.223}
        x2={-609.223}
        y1={-214.978}
        y2={-203.218}
        gradientTransform="matrix(1 0 0 -1 617.126 -205.758)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#5e9624" />
        <stop offset={1} stopColor="#b4ec36" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M14.239 17.221a1.363 1.363 0 0 0 1.383-1.341v-.031a1 1 0 0 0 0-.168c-.545-4.346-3.016-7.881-7.75-7.881s-7.246 3-7.76 7.9a1.4 1.4 0 0 0 1.247 1.529Z"
    />
    <path
      fill="#fff"
      d="M7.956 8.822a4.36 4.36 0 0 1-2.367-.691l2.283 6.105L10.2 8.173a4.4 4.4 0 0 1-2.244.649"
      opacity={0.8}
    />
    <circle cx={7.904} cy={4.466} r={4.367} fill={`url(#b-${suffix})`} />
    <path fill="#ef7100" d="M17.894 11.231v4.44l-3.812 2.23v-4.44z" />
    <path fill="#f78d1e" d="m17.894 11.231-3.812 2.23-3.812-2.23L14.082 9z" />
    <path fill="#faa21d" d="M14.082 13.461v4.44l-3.812-2.23v-4.44z" />
    <path fill="#ffb34d" d="m10.27 15.671 3.812-2.21v4.44z" />
    <path fill="#f78d1e" d="m17.894 15.671-3.812-2.21v4.44z" />
  </svg>
)}
export default SvgEntraIdentityCustomRoles
