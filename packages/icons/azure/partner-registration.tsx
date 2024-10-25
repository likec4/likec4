// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgPartnerRegistration = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={7.673} x2={7.673} y1={0.689} y2={16.067} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#5ea0ef" />
        <stop offset={1} stopColor="#0078d4" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={12.837} x2={12.837} y1={13.342} y2={11.165} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#0078d4" />
        <stop offset={1} stopColor="#5ea0ef" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M15.345 5.27h-4.538V.7l3.9-.043a.64.64 0 0 1 .64.641Zm-5.339.043V.657H5.382l.086 4.656ZM.043 10.7h4.624V6.039H0ZM0 15.394a.64.64 0 0 0 .641.64h4.026v-4.613H0ZM0 1.3l.043 3.97h4.624V.657H.641A.64.64 0 0 0 0 1.3"
    />
    <path
      fill="#a3a3a3"
      d="M6.38 6.634h.911v2.527a.205.205 0 0 1-.205.205h-.911a.2.2 0 0 1-.2-.205V7.043a.4.4 0 0 1 .395-.409Z"
    />
    <path
      fill="#a3a3a3"
      d="M6.38 6.634h.911v2.527a.205.205 0 0 1-.205.205h-.911a.2.2 0 0 1-.2-.205V7.043a.4.4 0 0 1 .395-.409Z"
      opacity={0.5}
    />
    <path
      fill="#a3a3a3"
      d="M16.68 6.634h.911a.4.4 0 0 1 .4.4v2.127a.205.205 0 0 1-.2.205h-.9a.205.205 0 0 1-.205-.205V6.634Z"
    />
    <path
      fill="#a3a3a3"
      d="M16.68 6.634h.911a.4.4 0 0 1 .4.4v2.127a.205.205 0 0 1-.2.205h-.9a.205.205 0 0 1-.205-.205V6.634Z"
      opacity={0.5}
    />
    <path fill="#949494" d="M17.993 7.029v.882h-12v-.882a.4.4 0 0 1 .4-.4h11.2a.4.4 0 0 1 .4.4" />
    <path
      fill="#a3a3a3"
      d="M6.175 14.59h.911a.2.2 0 0 1 .205.2v2.549H6.38a.4.4 0 0 1-.41-.395v-2.135a.2.2 0 0 1 .19-.219Z"
    />
    <path
      fill="#a3a3a3"
      d="M6.175 14.59h.911a.2.2 0 0 1 .205.2v2.549H6.38a.4.4 0 0 1-.41-.395v-2.135a.2.2 0 0 1 .19-.219Z"
      opacity={0.5}
    />
    <path
      fill="#a3a3a3"
      d="M16.885 14.59h.91a.2.2 0 0 1 .2.2v2.118a.4.4 0 0 1-.4.4h-.915v-2.499a.2.2 0 0 1 .19-.219Z"
    />
    <path
      fill="#a3a3a3"
      d="M16.885 14.59h.91a.2.2 0 0 1 .2.2v2.118a.4.4 0 0 1-.4.4h-.915v-2.499a.2.2 0 0 1 .19-.219Z"
      opacity={0.5}
    />
    <path fill="#949494" d="M5.971 16.941v-.883h12v.883a.4.4 0 0 1-.4.4H6.373a.4.4 0 0 1-.402-.4" />
    <path
      fill={`url(#b-${suffix})`}
      d="M14.6 13.516a.07.07 0 0 0 .055-.026l1.43-1.422a.16.16 0 0 0 0-.213l-1.43-1.446a.07.07 0 0 0-.056-.027.1.1 0 0 0-.044.014.07.07 0 0 0-.026.068v.888a.07.07 0 0 1-.062.079h-3.326a.82.82 0 0 0-.653-.322 1 1 0 0 0-.083 0 .864.864 0 0 0-.081 1.725 1 1 0 0 0 .082 0 1 1 0 0 0 .082 0 .85.85 0 0 0 .66-.33h3.317a.07.07 0 0 1 .071.063v.881a.07.07 0 0 0 .064.068"
    />
    <path fill="#773adc" d="M11.909 13.035A1.836 1.836 0 1 1 11.9 10.9h1a2.7 2.7 0 1 0 0 2.139Z" />
    {'\u200B'}
  </svg>
)}
export default SvgPartnerRegistration
