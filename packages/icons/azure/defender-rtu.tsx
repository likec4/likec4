// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgDefenderRtu = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18" {...props}>
    <path
      fill={`url(#a-${suffix})`}
      stroke="#fff"
      strokeWidth={0.25}
      d="M15.75 13.446h-.125v2.224q0 .251-.095.467-.097.221-.256.383-.158.161-.375.259a1.1 1.1 0 0 1-.459.096H1.31q-.25 0-.462-.089a1.05 1.05 0 0 1-.37-.255 1.4 1.4 0 0 1-.258-.394 1.2 1.2 0 0 1-.095-.467V5.759q0-.254.088-.471Q.3 5.07.465 4.91A1.4 1.4 0 0 1 .85 4.65a1.1 1.1 0 0 1 .459-.096h1.065V2.33q0-.254.088-.471.087-.217.252-.376A1.4 1.4 0 0 1 3.1 1.22a1.1 1.1 0 0 1 .459-.096h13.13a1.1 1.1 0 0 1 .459.096 1.23 1.23 0 0 1 .631.642q.095.216.095.467v9.911q0 .252-.095.468-.097.22-.256.382-.158.16-.375.26a1.1 1.1 0 0 1-.459.095zM17 12.255V2.33a.3.3 0 0 0-.089-.213.34.34 0 0 0-.207-.1H3.56a.3.3 0 0 0-.213.09.34.34 0 0 0-.096.209H3.25v2.237h4.453L2.375 10.58V5.446H1.31a.3.3 0 0 0-.213.091.34.34 0 0 0-.096.208H1v9.924q.002.126.089.213.085.086.207.1H14.44a.3.3 0 0 0 .213-.09.34.34 0 0 0 .096-.209h.001v-2.237h-4.453l5.328-6.027v5.135h1.065a.3.3 0 0 0 .213-.091.34.34 0 0 0 .096-.208Zm-2.375-7.701q.22 0 .415.087a.9.9 0 0 1 .27.19l-7.614 8.615H3.375q-.22 0-.415-.087a.9.9 0 0 1-.27-.19l7.614-8.615z"
    />
    <defs>
      <linearGradient id={`a-${suffix}`} x1={9} x2={9} y1={17} y2={1} gradientUnits="userSpaceOnUse">
        <stop stopColor="#0078D4" />
        <stop offset={0.156} stopColor="#1380DA" />
        <stop offset={0.528} stopColor="#3C91E5" />
        <stop offset={0.822} stopColor="#559CEC" />
        <stop offset={1} stopColor="#5EA0EF" />
      </linearGradient>
    </defs>
  </svg>
)}
export default SvgDefenderRtu
