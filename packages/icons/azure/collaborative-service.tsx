// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgCollaborativeService = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={13.398} x2={13.398} y1={1.747} y2={7.447} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#5ea0ef" />
        <stop offset={1} stopColor="#0078d4" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={2.85} x2={2.85} y1={5.341} y2={11.041} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#a67af4" />
        <stop offset={1} stopColor="#773adc" />
      </linearGradient>
      <linearGradient id={`c-${suffix}`} x1={11.829} x2={11.829} y1={12.149} y2={20.004} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#3cd4c2" />
        <stop offset={1} stopColor="#258277" />
      </linearGradient>
    </defs>
    <path
      fill="#0078d4"
      d="M14.428 6.615a.53.53 0 0 1-.438-.235l-2.639-3.965a2.643 2.643 0 0 0-4.443 0L5.43 4.7a.525.525 0 0 1-.882-.57l1.478-2.291a3.694 3.694 0 0 1 6.2 0L14.865 5.8a.526.526 0 0 1-.437.817Z"
    />
    <path
      fill="#37c2b1"
      d="M14.3 15.538h-3.169a.526.526 0 0 1 0-1.051H14.3a2.644 2.644 0 0 0 2.22-4.078l-1.178-1.828a.525.525 0 0 1 .883-.569L17.4 9.84a3.694 3.694 0 0 1-3.1 5.7Z"
    />
    <path
      fill="#a67af4"
      d="M7.269 15.538H4.322a3.694 3.694 0 0 1-3.1-5.7l1.944-2.975a.525.525 0 0 1 .879.575L2.1 10.412a2.643 2.643 0 0 0 2.221 4.075h2.948a.526.526 0 0 1 0 1.051"
    />
    <circle cx={13.398} cy={4.597} r={2.85} fill={`url(#a-${suffix})`} />
    <path fill={`url(#b-${suffix})`} d="M2.849 5.382A2.85 2.85 0 1 0 5.7 8.231a2.85 2.85 0 0 0-2.851-2.849" />
    <path fill={`url(#c-${suffix})`} d="M11.828 12.149A2.85 2.85 0 1 0 14.679 15a2.85 2.85 0 0 0-2.851-2.851" />
    {'\u200B'}
  </svg>
)}
export default SvgCollaborativeService
