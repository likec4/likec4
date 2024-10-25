// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgPrivateCertificateAuthority = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" {...props}>
    <defs>
      <clipPath id={`a-${suffix}`}>
        <path d="M80 0v80H0V0z" />
      </clipPath>
      <clipPath id={`c-${suffix}`}>
        <path d="M55 5a1 1 0 0 1 1 1v49a1 1 0 0 1-1 1h-6v-2h5V7h-2V5ZM7 52v2h34v2H6a1 1 0 0 1-1-1v-3zM49 0a1 1 0 0 1 1 1v48a1 1 0 0 1-1 1h-5v-2h4V7H2v41h34v2H1a1 1 0 0 1-1-1V1a1 1 0 0 1 1-1zM17 36v7.473l8.101-3.533a1 1 0 0 1 .798 0L34 43.473V36h2v9a1 1 0 0 1-1.399.917L25.5 41.948l-9.101 3.969A.999.999 0 0 1 15 45v-9zm8.5-27C32.944 9 39 15.056 39 22.5S32.944 36 25.5 36 12 29.944 12 22.5 18.056 9 25.5 9m0 2C19.159 11 14 16.159 14 22.5S19.159 34 25.5 34 37 28.841 37 22.5 31.841 11 25.5 11m5.293 7.293 1.414 1.414-8 8a.997.997 0 0 1-1.414 0l-4-4 1.414-1.414 3.293 3.293zM48 2H2v3h46z" />
      </clipPath>
      <linearGradient id={`b-${suffix}`} x1={0} x2={80} y1={80} y2={0} gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#BD0816" />
        <stop offset="100%" stopColor="#FF5252" />
      </linearGradient>
    </defs>
    <g clipPath={`url(#a-${suffix})`}>
      <path fill={`url(#b-${suffix})`} d="M0 0h80v80H0z" />
    </g>
    <g clipPath={`url(#c-${suffix})`} transform="translate(12 12)">
      <path fill="#FFF" d="M0 0h56v56H0z" />
    </g>
  </svg>
)}
export default SvgPrivateCertificateAuthority
