// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgInsomnia = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" {...props}>
    <defs>
      <linearGradient
        id={`a-${suffix}`}
        x1={16.181}
        x2={16.181}
        y1={28.39}
        y2={5.61}
        gradientTransform="matrix(4 0 0 4 0 -4)"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#7400E1" />
        <stop offset={1} stopColor="#4000BF" />
      </linearGradient>
    </defs>
    <path
      fill="#fff"
      d="M64 124.746c33.549 0 60.746-27.197 60.746-60.746S97.549 3.254 64 3.254 3.254 30.451 3.254 64 30.451 124.746 64 124.746"
    />
    <path
      fill="#4000bf"
      d="M64 0C28.654 0 0 28.654 0 64s28.654 64 64 64 64-28.654 64-64S99.346 0 64 0m0 6.509c31.752 0 57.492 25.74 57.492 57.491S95.752 121.492 64 121.492 6.508 95.752 6.508 64 32.248 6.509 64 6.509"
    />
    <path
      fill={`url(#a-${suffix})`}
      d="M64.723 18.44c25.162 0 45.56 20.398 45.56 45.56s-20.398 45.56-45.56 45.56c-25.161 0-45.559-20.398-45.559-45.56a45.4 45.4 0 0 1 3.427-17.366c3.224 4.391 8.425 7.242 14.29 7.242 9.786 0 17.718-7.932 17.718-17.718 0-5.866-2.85-11.066-7.242-14.29a45.4 45.4 0 0 1 17.366-3.427z"
    />
  </svg>
)}
export default SvgInsomnia
