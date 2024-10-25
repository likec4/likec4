// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgBlobPage = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={9} x2={9} y1={15.834} y2={5.788} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#32bedd" />
        <stop offset={0.775} stopColor="#32d4f5" />
      </linearGradient>
    </defs>
    <path fill={`url(#a-${suffix})`} d="M.5 5.788h17v9.478a.57.57 0 0 1-.568.568H1.068a.57.57 0 0 1-.568-.568z" />
    <path fill="#198ab3" d="M1.071 2.166h15.858a.57.57 0 0 1 .568.568v3.054H.5V2.734a.57.57 0 0 1 .571-.568" />
    <path
      fill="#fff"
      d="M12.818 6.945H9.737a.243.243 0 0 0-.243.243v6.646a.243.243 0 0 0 .243.243h5.34a.243.243 0 0 0 .244-.243v-4.4a.244.244 0 0 0-.244-.244h-1.772a.243.243 0 0 1-.243-.244V7.188a.243.243 0 0 0-.244-.243"
    />
    <path
      fill="#c3f1ff"
      d="M12.706 7.256v1.669a.613.613 0 0 0 .612.612H15v4.229H9.815v-6.51zm.118-.365H9.7a.247.247 0 0 0-.247.247v6.746a.247.247 0 0 0 .247.247h5.42a.247.247 0 0 0 .247-.247V9.419a.25.25 0 0 0-.247-.247h-1.8a.247.247 0 0 1-.247-.247V7.138a.247.247 0 0 0-.247-.247Z"
    />
    <path fill="#50e6ff" d="m15.27 9.221-2.284-2.276V8.8a.42.42 0 0 0 .416.421Z" />
    <path
      fill="#fff"
      d="M6.251 6.945H3.169a.243.243 0 0 0-.243.243v6.646a.243.243 0 0 0 .243.243H8.51a.243.243 0 0 0 .243-.243v-4.4a.243.243 0 0 0-.243-.244H6.737a.243.243 0 0 1-.243-.244V7.188a.243.243 0 0 0-.243-.243"
    />
    <path
      fill="#c3f1ff"
      d="M6.138 7.256v1.669a.613.613 0 0 0 .612.612h1.682v4.229H3.248v-6.51zm.118-.365H3.13a.246.246 0 0 0-.247.247v6.746a.246.246 0 0 0 .247.247h5.419a.246.246 0 0 0 .247-.247V9.419a.247.247 0 0 0-.247-.247H6.75a.25.25 0 0 1-.25-.247V7.138a.246.246 0 0 0-.247-.247Z"
    />
    <path fill="#50e6ff" d="M8.7 9.221 6.418 6.945V8.8a.42.42 0 0 0 .416.421Z" />
  </svg>
)}
export default SvgBlobPage
