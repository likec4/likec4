// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgTfsVcRepository = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={5.236} x2={5.236} y1={17.5} y2={13.544} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#a67af4" />
        <stop offset={0.775} stopColor="#b796f9" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={15.532} x2={15.532} y1={9.063} y2={5.107} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#a67af4" />
        <stop offset={0.775} stopColor="#b796f9" />
      </linearGradient>
      <linearGradient id={`c-${suffix}`} x1={12.259} x2={12.259} y1={15.541} y2={11.585} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#a67af4" />
        <stop offset={0.775} stopColor="#b796f9" />
      </linearGradient>
      <linearGradient id={`d-${suffix}`} x1={5.094} x2={5.094} y1={9.709} y2={0.5} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#a67af4" />
        <stop offset={0.485} stopColor="#ae87f6" />
        <stop offset={0.898} stopColor="#b796f9" />
      </linearGradient>
      <linearGradient id={`e-${suffix}`} x1={5.094} x2={5.094} y1={8.264} y2={1.945} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#e6e6e6" />
        <stop offset={0.898} stopColor="#f2f2f2" />
      </linearGradient>
    </defs>
    <path
      fill="#773adc"
      d="M4.367 8.541h1.455v6.088H4.367zM8.489 7.813V6.358h6.088v1.455zM6.61 9.04l1.028-1.029 4.305 4.305-1.029 1.029z"
    />
    <circle cx={5.236} cy={15.522} r={1.978} fill={`url(#a-${suffix})`} />
    <circle cx={15.532} cy={7.085} r={1.978} fill={`url(#b-${suffix})`} />
    <circle cx={12.259} cy={13.563} r={1.978} fill={`url(#c-${suffix})`} />
    <circle cx={5.094} cy={5.105} r={4.605} fill={`url(#d-${suffix})`} />
    <circle cx={5.094} cy={5.105} r={3.16} fill={`url(#e-${suffix})`} />
  </svg>
)}
export default SvgTfsVcRepository
