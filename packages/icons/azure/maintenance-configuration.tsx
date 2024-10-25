// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgMaintenanceConfiguration = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <radialGradient
        id={`a-${suffix}`}
        cx={5.614}
        cy={6.147}
        r={7.443}
        gradientTransform="translate(1.878 1.801)scale(.944)"
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
        id={`b-${suffix}`}
        cx={6.45}
        cy={6.92}
        r={1.041}
        gradientTransform="translate(1.124 1.09)scale(.943)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#7f7f7f" />
        <stop offset={1} stopColor="#5e5e5e" />
      </radialGradient>
    </defs>
    <circle cx={7.18} cy={7.607} r={7.03} fill={`url(#a-${suffix})`} />
    <circle cx={7.208} cy={7.607} r={6.121} fill="#fff" />
    <path
      fill="#7a7a7a"
      d="M7.038 11.73h.338v1.05h-.338zm-3.7-7.75.24-.24.742.742-.24.24zm.052 7.2.742-.742.24.24-.742.742zM1.945 7.43h1.05v.338h-1.05zm7.8 2.054L7.957 7.706a.43.43 0 0 0-.291-.123.4.4 0 0 0 .054-.2V2.858a.43.43 0 0 0-.43-.43h-.082a.43.43 0 0 0-.431.43v4.53a.43.43 0 0 0 .431.43h.048a.43.43 0 0 0 .035.555l1.78 1.777a.43.43 0 0 0 .608 0l.058-.058a.43.43 0 0 0 0-.608z"
    />
    <circle cx={7.212} cy={7.596} r={0.996} fill={`url(#b-${suffix})`} />
    <path
      fill="#949494"
      d="m8.855 16.582 5.535-6.324a2.9 2.9 0 0 0 2.763-.875 2.69 2.69 0 0 0 .558-2.661l-1.465 1.645-1.567-.29-.52-1.487 1.466-1.62a2.87 2.87 0 0 0-2.643.885 2.65 2.65 0 0 0-.54 2.651l-5.9 6.745a1.309 1.309 0 0 0 1.97 1.724z"
    />
  </svg>
)}
export default SvgMaintenanceConfiguration
