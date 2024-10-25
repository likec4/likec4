// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgAquila = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={10.686} x2={10.686} y1={0.143} y2={5.035} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#83b9f9" />
        <stop offset={1} stopColor="#5ea0ef" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={14.828} x2={14.828} y1={4.906} y2={17.857} gradientUnits="userSpaceOnUse">
        <stop offset={0.154} stopColor="#83b9f9" />
        <stop offset={1} stopColor="#5ea0ef" />
      </linearGradient>
      <linearGradient id={`c-${suffix}`} x1={10.579} x2={10.579} y1={5.034} y2={17.815} gradientUnits="userSpaceOnUse">
        <stop offset={0.192} stopColor="#5ea0ef" />
        <stop offset={1} stopColor="#0078d4" />
      </linearGradient>
      <linearGradient id={`d-${suffix}`} x1={7.95} x2={7.95} y1={0.66} y2={7.625} gradientUnits="userSpaceOnUse">
        <stop offset={0.441} stopColor="#5ea0ef" />
        <stop offset={1} stopColor="#0078d4" />
      </linearGradient>
      <linearGradient id={`e-${suffix}`} x1={3.554} x2={3.554} y1={3.554} y2={12.77} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#0078d4" />
        <stop offset={1} stopColor="#005ba1" />
      </linearGradient>
      <linearGradient id={`f-${suffix}`} x1={6.163} x2={6.163} y1={8.759} y2={13.256} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#0078d4" />
        <stop offset={1} stopColor="#005ba1" />
      </linearGradient>
      <linearGradient id={`g-${suffix}`} x1={13.5} x2={13.5} y1={9.366} y2={17.428} gradientUnits="userSpaceOnUse">
        <stop offset={0.152} stopColor="#fff" />
        <stop offset={1} stopColor="#f2f2f2" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M14.489 5.021a8.1 8.1 0 0 0-2.832.014A12.15 12.15 0 0 0 6.883.66 5.2 5.2 0 0 1 9.24.146a5.1 5.1 0 0 1 5.249 4.875"
    />
    <path
      fill={`url(#b-${suffix})`}
      d="M18 13.373a4.5 4.5 0 0 1-4.5 4.484 4.4 4.4 0 0 1-.61-.042 12.2 12.2 0 0 0 1.149-4.964 11.7 11.7 0 0 0-.582-3.961 15.7 15.7 0 0 0-1.8-3.856 8.1 8.1 0 0 1 2.832-.014A4.045 4.045 0 0 1 18 8.908a4.06 4.06 0 0 1-.674 2.107A4.43 4.43 0 0 1 18 13.373"
    />
    <path
      fill={`url(#c-${suffix})`}
      d="M14.039 12.851a12.2 12.2 0 0 1-1.149 4.964 4 4 0 0 1-.387-.069A4.5 4.5 0 0 1 9 13.373a4 4 0 0 1 .027-.484H8.59a17.6 17.6 0 0 0-1.482-5.265A13 13 0 0 1 8.59 6.335a7.2 7.2 0 0 1 3.067-1.3 15.7 15.7 0 0 1 1.8 3.856 11.7 11.7 0 0 1 .582 3.96"
    />
    <path
      fill={`url(#d-${suffix})`}
      d="M11.657 5.035a7.2 7.2 0 0 0-3.067 1.3 13 13 0 0 0-1.482 1.29 18 18 0 0 0-.19-.4 12 12 0 0 0-2.674-3.671A5.23 5.23 0 0 1 6.883.66a12.15 12.15 0 0 1 4.774 4.375"
    />
    <path
      fill={`url(#e-${suffix})`}
      d="M7.108 7.625a17.3 17.3 0 0 0-3.372 5.145A4.9 4.9 0 0 1 0 8.2a4.825 4.825 0 0 1 4.244-4.646 12 12 0 0 1 2.674 3.674q.097.195.19.397"
    />
    <path
      fill={`url(#f-${suffix})`}
      d="m8.59 12.891-3.52.014a4.9 4.9 0 0 1-1.334-.135 17.3 17.3 0 0 1 3.372-5.145 17.6 17.6 0 0 1 1.482 5.266"
    />
    <ellipse cx={13.5} cy={13.373} fill={`url(#g-${suffix})`} rx={3.917} ry={3.901} />
    <path
      fill="#83b9f9"
      d="M10.176 13.606a3.3 3.3 0 0 0 .963 2.118l1.061-1.059a1.87 1.87 0 0 1-.529-1.059ZM15.687 10.869a3.3 3.3 0 0 0-1.954-.81v1.477a1.8 1.8 0 0 1 .906.371ZM11.314 10.869l1.059 1.059a1.8 1.8 0 0 1 .905-.37v-1.5a3.3 3.3 0 0 0-1.964.811M14.972 12.235a1.9 1.9 0 0 1 .376.905h1.477a3.26 3.26 0 0 0-.81-1.942ZM12.029 12.235l-1.059-1.059a3.26 3.26 0 0 0-.794 1.964h1.477a1.9 1.9 0 0 1 .376-.905"
    />
    <path
      fill="#f04049"
      d="M16.221 12.315a.24.24 0 0 0-.3-.133l-2.181.879.169.429 2.181-.863a.233.233 0 0 0 .138-.3Z"
    />
    <circle cx={13.5} cy={13.373} r={0.635} fill="#4f4f4f" />
  </svg>
)}
export default SvgAquila
