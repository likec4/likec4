// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgAmplify = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1="0%" x2="100%" y1="100%" y2="0%">
        <stop offset="0%" stopColor="#BD0816" />
        <stop offset="100%" stopColor="#FF5252" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <path fill={`url(#a-${suffix})`} d="M0 0h80v80H0z" />
      <path
        fill="#FFF"
        d="M59.61 59.179 39.508 20h5.75l20.106 39.179zm8.279.543-21.13-41.178a1 1 0 0 0-.89-.544h-8a1 1 0 0 0-.89 1.457l21.13 41.179c.172.333.516.543.89.543h8a.998.998 0 0 0 .89-1.457m-20.29-.543L32.215 30.332l3.15-5.211 17.976 34.058zm-11.29-36.555a1 1 0 0 0-.854-.533 1 1 0 0 0-.885.482l-4.36 7.211a1 1 0 0 0-.028.988L46.117 60.65c.174.325.514.529.883.529h8a1 1 0 0 0 .884-1.467zM14.774 59.179 28.885 35.84l2.875 5.389-6.626 11.449A1.002 1.002 0 0 0 26 54.179h12.667l2.666 5zm25.376-6.471a1 1 0 0 0-.883-.529H27.734l6.035-10.429a1 1 0 0 0 .018-.971l-3.964-7.433a1 1 0 0 0-.856-.529.96.96 0 0 0-.882.482L12.144 59.661A1.003 1.003 0 0 0 13 61.179h30a1 1 0 0 0 .882-1.471z"
      />
    </g>
  </svg>
)}
export default SvgAmplify
