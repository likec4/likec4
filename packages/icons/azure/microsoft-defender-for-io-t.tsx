// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgMicrosoftDefenderForIoT = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={9} x2={9} y1={17.253} y2={0.747} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#50e6ff" />
        <stop offset={1} stopColor="#9cebff" />
      </linearGradient>
    </defs>
    <path
      fill="#50e6ff"
      d="M16.364 8.4c0 4.84-5.849 8.736-7.122 9.526a.46.46 0 0 1-.484 0c-1.273-.79-7.122-4.686-7.122-9.526V2.582a.463.463 0 0 1 .452-.462C6.638 2 5.59 0 9 0s2.362 2 6.912 2.12a.463.463 0 0 1 .452.462Z"
    />
    <path
      fill={`url(#a-${suffix})`}
      d="M15.754 8.454c0 4.438-5.365 8.011-6.532 8.736a.42.42 0 0 1-.444 0c-1.167-.725-6.532-4.3-6.532-8.736v-5.34a.425.425 0 0 1 .415-.423C6.834 2.578 5.873.747 9 .747s2.166 1.831 6.339 1.944a.425.425 0 0 1 .415.423Z"
    />
    <circle cx={9.854} cy={8.037} r={1.281} fill="#fff" />
    <circle cx={8.014} cy={11.159} r={0.865} fill="#fff" />
    <circle cx={7.39} cy={4.571} r={1.073} fill="#fff" />
    <path
      fill="#e6e6e6"
      d="m12.234 11.646-2.165-3.791-.215.124.176-.13-2.452-3.486-.448.326 2.172 3.088-4.813.397.046.559 4.767-.396-1.581 2.627.475.286 1.626-2.705 1.931 3.375z"
    />
    <path
      fill="#fff"
      d="M9.854 6.769a1.3 1.3 0 1 1-1.3 1.3v-.032a1.3 1.3 0 0 1 1.3-1.268m-3.511-2.2A1.08 1.08 0 1 0 7.428 3.5H7.4a1.07 1.07 0 0 0-1.057 1.071Zm-2.692 3.95a.865.865 0 1 0 .864-.865.865.865 0 0 0-.864.865m3.5 2.633a.872.872 0 1 0 .878-.865H8.02a.866.866 0 0 0-.871.859Zm3.85.7a1.008 1.008 0 1 0 1.014-1h-.006a.994.994 0 0 0-1.009.976Z"
    />
    {'\u200B'}
  </svg>
)}
export default SvgMicrosoftDefenderForIoT
