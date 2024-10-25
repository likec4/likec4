// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgDefenderEngineeringStation = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18" {...props}>
    <path
      fill={`url(#a-${suffix})`}
      d="M17.038 1.065H.963a.55.55 0 0 0-.548.548v10.35c0 .304.245.549.548.549h16.075a.55.55 0 0 0 .548-.548V1.613a.55.55 0 0 0-.548-.548"
    />
    <path
      fill={`url(#b-${suffix})`}
      d="M12.443 15.975c-1.7-.265-1.764-1.49-1.759-3.463H7.316c0 1.973-.062 3.2-1.76 3.463a1 1 0 0 0-.846.96h8.59a1 1 0 0 0-.857-.96"
    />
    <path
      fill={`url(#c-${suffix})`}
      d="m4.044 6.353.347-.346 2.731 2.74a.157.157 0 0 1 0 .221l-.347.346a.157.157 0 0 1-.222 0l-2.51-2.518a.314.314 0 0 1 0-.444z"
    />
    <path
      fill="#F2F2F2"
      d="m4.386 7.144-.346-.347a.314.314 0 0 1 0-.444l2.562-2.554a.157.157 0 0 1 .222 0l.346.347a.157.157 0 0 1 0 .222z"
    />
    <path
      fill={`url(#d-${suffix})`}
      d="m11.42 9.317-.347-.346a.157.157 0 0 1 0-.222l2.735-2.743.347.346a.314.314 0 0 1 0 .444l-2.513 2.521a.157.157 0 0 1-.223 0z"
    />
    <path
      fill="#F2F2F2"
      d="m11.02 4.148.346-.347a.157.157 0 0 1 .222 0l2.562 2.554a.314.314 0 0 1 0 .444l-.346.347-2.781-2.774a.157.157 0 0 1-.003-.224M10.588 2.939l-.554-.178a.11.11 0 0 0-.141.073l-2.26 7.057a.11.11 0 0 0 .073.141l.554.177a.11.11 0 0 0 .141-.072l2.26-7.057a.11.11 0 0 0-.073-.141"
    />
    <defs>
      <linearGradient id={`a-${suffix}`} x1={9} x2={9} y1={12.513} y2={1.065} gradientUnits="userSpaceOnUse">
        <stop stopColor="#0078D4" />
        <stop offset={0.817} stopColor="#5EA0EF" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={9.003} x2={9.003} y1={16.935} y2={12.512} gradientUnits="userSpaceOnUse">
        <stop offset={0.149} stopColor="#CCC" />
        <stop offset={1} stopColor="#707070" />
      </linearGradient>
      <linearGradient id={`c-${suffix}`} x1={3.951} x2={7.172} y1={7.685} y2={7.685} gradientUnits="userSpaceOnUse">
        <stop stopColor="#5EA0EF" />
        <stop offset={0.372} stopColor="#9FC6F5" />
        <stop offset={0.8} stopColor="#E4EFFC" />
        <stop offset={1} stopColor="#fff" />
      </linearGradient>
      <linearGradient id={`d-${suffix}`} x1={11.027} x2={14.247} y1={7.685} y2={7.685} gradientUnits="userSpaceOnUse">
        <stop stopColor="#fff" />
        <stop offset={0.2} stopColor="#E4EFFC" />
        <stop offset={0.628} stopColor="#9FC6F5" />
        <stop offset={1} stopColor="#5EA0EF" />
      </linearGradient>
    </defs>
  </svg>
)}
export default SvgDefenderEngineeringStation
