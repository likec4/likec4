// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgAzureSustainability = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={9} x2={9} y1={12.603} y2={0.003} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#0078d4" />
        <stop offset={1} stopColor="#5ea0ef" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={7.271} x2={16.7} y1={13.496} y2={13.496} gradientUnits="userSpaceOnUse">
        <stop offset={0.496} stopColor="#5e9624" />
        <stop offset={0.999} stopColor="#365615" />
      </linearGradient>
      <linearGradient id={`c-${suffix}`} x1={8.571} x2={18} y1={13.544} y2={13.544} gradientUnits="userSpaceOnUse">
        <stop offset={0.001} stopColor="#76bc2d" />
        <stop offset={1} stopColor="#86d633" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M9.48 10.026a5.34 5.34 0 0 1 3.186-1.631 17 17 0 0 1 2.175-.152c1.065 0 2.011.12 2.892.368q.137.04.262.107.003-.082.004-.165a4.05 4.05 0 0 0-3.672-4.033 5.4 5.4 0 0 0-10.655.001 4.051 4.051 0 0 0 .378 8.083h4.205c.071-.886.508-1.812 1.226-2.577Z"
    />
    <path
      fill={`url(#b-${suffix})`}
      d="M8.572 17.315c.05-.827.424-1.835 1.056-2.786.204-.347.457-.7.759-1.043a7.6 7.6 0 0 1 3.852-2.357.428.428 0 1 0-.208-.831 8.47 8.47 0 0 0-4.287 2.623 8 8 0 0 0-.623.808 3 3 0 0 1-.126-.873c0-.786.4-1.639 1.034-2.316a4.56 4.56 0 0 1 2.737-1.4c2.4-.318 3.888-.052 4.766.195a.643.643 0 0 1 .181 1.154c-.049.033-.128.111-.223.291a4.3 4.3 0 0 0-.274.707c-.075.244-.147.507-.224.793l-.049.181a19 19 0 0 1-.327 1.102c-.25.739-.603 1.527-1.197 2.132-.616.628-1.452 1.019-2.569 1.019-1.139 0-1.934-.461-2.442-.992-.346.634-.526 1.231-.553 1.672a.642.642 0 1 1-1.282-.079Z"
    />
    <path
      fill={`url(#c-${suffix})`}
      d="M8.572 17.315c.05-.827.424-1.835 1.056-2.786.204-.347.457-.7.759-1.043a7.6 7.6 0 0 1 3.852-2.357c1.648-.387 3.275-1.355 2.106-2.038.595.074.979.188 1.186.244a.642.642 0 0 1 .181 1.154c-.049.033-.128.111-.223.291a4.3 4.3 0 0 0-.274.707c-.075.244-.147.507-.224.793l-.049.181a19 19 0 0 1-.327 1.102c-.25.739-.603 1.527-1.197 2.132-.616.628-1.452 1.019-2.569 1.019-1.139 0-1.934-.461-2.442-.992-.346.634-.526 1.231-.553 1.672a.642.642 0 1 1-1.282-.079"
    />
  </svg>
)}
export default SvgAzureSustainability
