// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgBizTalk = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={9} x2={9} y1={13.343} y2={0.586} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#0078d4" />
        <stop offset={1} stopColor="#5ea0ef" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={9.104} x2={9.104} y1={10.28} y2={7.603} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#76bc2d" />
        <stop offset={0.412} stopColor="#7ac32f" />
        <stop offset={1} stopColor="#86d633" />
      </linearGradient>
      <linearGradient id={`c-${suffix}`} x1={9.119} x2={9.119} y1={17.414} y2={13.924} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#0078d4" />
        <stop offset={1} stopColor="#5ea0ef" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M18 9.348a4.045 4.045 0 0 0-3.51-3.888A5.1 5.1 0 0 0 9.24.586a5.23 5.23 0 0 0-5 3.407A4.83 4.83 0 0 0 0 8.637a4.9 4.9 0 0 0 5.068 4.706q.226 0 .447-.019h8.207a.8.8 0 0 0 .217-.032A4.093 4.093 0 0 0 18 9.348"
    />
    <path fill="#005ba1" d="M8.295 10.097h1.693v5.35H8.295z" />
    <path
      fill="#fff"
      d="M13.937 5.8a.207.207 0 0 0-.207-.2h-2.445a.092.092 0 0 0-.065.158l.705.705.047.047a.094.094 0 0 1 0 .13l-.747.747a2.68 2.68 0 0 0-1.517-1.038V4.874a.093.093 0 0 1 .092-.093h1.068a.093.093 0 0 0 .066-.158L9.2 2.886a.207.207 0 0 0-.293 0l-1.74 1.737a.092.092 0 0 0 .065.158H8.3a.093.093 0 0 1 .093.093v1.475a2.68 2.68 0 0 0-1.56 1.092l-.805-.8a.094.094 0 0 1 0-.13l.047-.047.705-.7a.092.092 0 0 0-.065-.164H4.27a.207.207 0 0 0-.207.206v2.443a.093.093 0 0 0 .158.065l.705-.7.047-.047a.09.09 0 0 1 .13 0l1.275 1.271v.1a2.677 2.677 0 1 0 5.354 0q-.001-.1-.01-.2l1.18-1.18a.09.09 0 0 1 .13 0l.047.047.705.705a.093.093 0 0 0 .158-.065Z"
    />
    <circle cx={9.104} cy={8.941} r={1.338} fill={`url(#b-${suffix})`} />
    <circle cx={9.119} cy={15.669} r={1.745} fill={`url(#c-${suffix})`} />
  </svg>
)}
export default SvgBizTalk
