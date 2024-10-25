// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgFolderBlank = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={9.252} x2={8.842} y1={0.485} y2={16.966} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#ffd400" />
        <stop offset={0.415} stopColor="#ffd000" />
        <stop offset={0.845} stopColor="#ffc301" />
        <stop offset={1} stopColor="#ffbd02" />
      </linearGradient>
    </defs>
    <path
      fill="#dfa500"
      d="M17.579 3.283H9.727a.4.4 0 0 1-.233-.07L7.251 1.721a.4.4 0 0 0-.233-.071H.421A.42.42 0 0 0 0 2.07v13.86a.42.42 0 0 0 .421.42h17.158a.42.42 0 0 0 .421-.42V3.7a.42.42 0 0 0-.421-.417"
    />
    <rect width={4.091} height={0.818} x={1.636} y={2.455} fill="#fff" rx={0.172} />
    <path
      fill={`url(#a-${suffix})`}
      d="M17.579 3.263H8.956a.42.42 0 0 0-.3.123L7.272 4.773a.42.42 0 0 1-.3.123H.421a.42.42 0 0 0-.421.42V15.91a.42.42 0 0 0 .421.419h17.158A.42.42 0 0 0 18 15.91V3.683a.42.42 0 0 0-.421-.42"
    />
  </svg>
)}
export default SvgFolderBlank
