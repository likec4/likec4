// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgEntraVerifiedId = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={8.985} x2={8.985} y1={13.416} y2={0.837} gradientUnits="userSpaceOnUse">
        <stop offset={0.089} stopColor="#225086" />
        <stop offset={0.458} stopColor="#0055c5" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={15.2} x2={15.2} y1={17.152} y2={8.114} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#0294e4" />
        <stop offset={0.192} stopColor="#23aced" />
        <stop offset={0.398} stopColor="#40c1f4" />
        <stop offset={0.603} stopColor="#55d0fa" />
        <stop offset={0.805} stopColor="#61d9fd" />
        <stop offset={1} stopColor="#6df" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M11.95 10.924a3.26 3.26 0 0 1 3.25-3.26 3.25 3.25 0 0 1 2.77 1.556V1.437a.6.6 0 0 0-.6-.6H.6a.6.6 0 0 0-.6.6v11.379a.6.6 0 0 0 .6.6h12.509a3.27 3.27 0 0 1-1.159-2.492"
    />
    <path
      fill="#6df"
      d="M6.616 10.125a.47.47 0 0 0 .486-.452v-.014a.3.3 0 0 0 0-.058C6.909 8.069 6.039 6.83 4.379 6.83S1.811 7.884 1.631 9.589a.49.49 0 0 0 .438.535z"
    />
    <path fill="#f2f2f2" d="M4.398 7.194a1.53 1.53 0 0 1-.811-.244l.811 2.145.82-2.13c-.247.151-.531.23-.82.229" />
    <circle cx={4.388} cy={5.661} r={1.533} fill="#6df" />
    <rect width={7.631} height={1.483} x={7.828} y={4.128} fill="#6df" rx={0.741} ry={0.741} />
    <path fill="#6df" d="M13.267 7.823H8.57a.741.741 0 0 0 0 1.482h3.211c.284-.592.712-1.144 1.486-1.483Z" />
    <path
      fill={`url(#b-${suffix})`}
      d="M18 10.924c0-1.552-1.254-2.81-2.8-2.81s-2.8 1.258-2.8 2.81c0 .948.469 1.784 1.185 2.293l-.18 3.598a.31.31 0 0 0 .529.233l1.217-.771 1.208.782a.31.31 0 0 0 .531-.229l-.139-3.566a2.81 2.81 0 0 0 1.25-2.339Z"
    />
    <path
      fill="#fff"
      d="M14.652 12.251a.33.33 0 0 1-.237-.098l-.971-.971a.335.335 0 0 1 .472-.472l.735.737 1.8-1.801a.335.335 0 0 1 .472.472l-2.036 2.036a.33.33 0 0 1-.236.096Z"
    />
  </svg>
)}
export default SvgEntraVerifiedId
