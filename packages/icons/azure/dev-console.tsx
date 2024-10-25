// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgDevConsole = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={9} x2={9} y1={15.834} y2={5.788} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#32bedd" />
        <stop offset={0.175} stopColor="#32caea" />
        <stop offset={0.41} stopColor="#32d2f2" />
        <stop offset={0.775} stopColor="#32d4f5" />
      </linearGradient>
    </defs>
    <path fill={`url(#a-${suffix})`} d="M.5 5.788h17v9.478a.57.57 0 0 1-.568.568H1.068a.57.57 0 0 1-.568-.568z" />
    <path fill="#0078d4" d="M1.071 2.166h15.858a.57.57 0 0 1 .568.568v3.054H.5V2.734a.57.57 0 0 1 .571-.568" />
    <path
      fill="#f2f2f2"
      d="m2.825 7.979.369-.37a.167.167 0 0 1 .236-.001l2.732 2.724a.335.335 0 0 1 0 .474l-.368.37-2.968-2.96a.167.167 0 0 1-.001-.237"
    />
    <path
      fill="#e6e6e6"
      d="m3.249 13.504-.37-.37a.167.167 0 0 1 0-.236l2.916-2.925.37.368a.335.335 0 0 1 0 .474l-2.683 2.691a.167.167 0 0 1-.233-.002"
    />
    <rect width={4.771} height={1.011} x={7.221} y={12.64} fill="#f2f2f2" rx={0.291} />
  </svg>
)}
export default SvgDevConsole
