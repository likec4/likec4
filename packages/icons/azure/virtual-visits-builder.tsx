// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgVirtualVisitsBuilder = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient
        id={`a-${suffix}`}
        x1={-1516.205}
        x2={-1516.205}
        y1={1550.824}
        y2={1560.012}
        gradientTransform="matrix(1 0 0 -1 1524 1565.516)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0.001} stopColor="#773adc" />
        <stop offset={0.229} stopColor="#7b3fde" />
        <stop offset={0.507} stopColor="#864ee4" />
        <stop offset={0.811} stopColor="#9867ed" />
        <stop offset={1} stopColor="#a67af4" />
      </linearGradient>
      <linearGradient
        id={`b-${suffix}`}
        x1={-551.781}
        x2={-551.781}
        y1={1016.108}
        y2={1009.663}
        gradientTransform="matrix(1 0 0 -1 564 1025.516)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#50e6ff" />
        <stop offset={1} stopColor="#32bedd" />
      </linearGradient>
    </defs>
    <path fill={`url(#a-${suffix})`} d="M.02 5.5h15.549v8.669a.52.52 0 0 1-.519.52H.54a.52.52 0 0 1-.52-.52z" />
    <path fill="#773adc" d="M.542 2.19h14.505a.52.52 0 0 1 .519.52V5.5H.02V2.71a.52.52 0 0 1 .52-.52Z" />
    <path
      fill="#f2f2f2"
      d="M1.847 10.723V6.892c0-.1.06-.183.134-.183h5.338c.074 0 .134.082.134.183v3.831c0 .1-.06.182-.134.182H1.981c-.074 0-.134-.081-.134-.182"
    />
    <path
      fill="#b796f9"
      d="M7.146 13.486H2.154c-.17 0-.307-.082-.307-.182v-1.273c0-.1.137-.182.307-.182h4.992c.17 0 .307.081.307.182V13.3c0 .1-.137.186-.307.186M14 8.226H8.827c-.176 0-.318-.081-.318-.182V6.787c0-.1.142-.182.318-.182H14c.176 0 .318.081.318.182v1.257c-.001.101-.143.182-.318.182"
    />
    <path
      fill="#32bedd"
      d="m17.643 14.8-3.277-1.525a.38.38 0 0 1-.233-.389v-.526a.39.39 0 0 1 .233-.39l3.277-1.524c.175-.045.337.142.337.389v3.575c0 .248-.164.434-.337.39"
    />
    <rect width={7.35} height={6.422} x={8.544} y={9.388} fill={`url(#b-${suffix})`} rx={0.385} />
    <path
      fill="#c3f1ff"
      d="M10.79 12.623v-1.379a.382.382 0 0 1 .573-.331l1.2.69 1.194.689a.383.383 0 0 1 0 .662l-1.194.689-1.2.69A.382.382 0 0 1 10.79 14Z"
    />
  </svg>
)}
export default SvgVirtualVisitsBuilder
