// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgBareMetalInfrastructure = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={9} x2={9} y1={13.08} y2={1.019} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#005ba1" />
        <stop offset={0.16} stopColor="#005fa8" stopOpacity={0.866} />
        <stop offset={0.491} stopColor="#0069b9" stopOpacity={0.52} />
        <stop offset={0.939} stopColor="#0078d4" stopOpacity={0} />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={9.443} x2={9.443} y1={16.981} y2={14.094} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#005ba1" />
        <stop offset={0.15} stopColor="#0063af" />
        <stop offset={0.439} stopColor="#006fc3" />
        <stop offset={0.724} stopColor="#0076d0" />
        <stop offset={1} stopColor="#0078d4" />
      </linearGradient>
    </defs>
    <path fill="#76bc2d" d="M16.674 16.136H1.884a.474.474 0 1 1 0-.948h14.79a.474.474 0 1 1 0 .948" />
    <path fill="#76bc2d" d="M8.893 12.704h1.129v2.994H8.893z" />
    <rect width={4.058} height={17} x={6.971} y={-5.452} fill="#5ea0ef" rx={0.567} transform="rotate(90 9 3.048)" />
    <rect width={4.058} height={17} x={6.971} y={-1.479} fill="#0078d4" rx={0.567} transform="rotate(90 9 7.021)" />
    <rect width={4.058} height={17} x={6.971} y={2.551} fill="#005ba1" rx={0.567} transform="rotate(90 9 11.051)" />
    <path
      fill={`url(#a-${suffix})`}
      d="M17.5 4.511V1.586a.567.567 0 0 0-.567-.567H1.067a.567.567 0 0 0-.567.567v2.925a.57.57 0 0 0 .352.524.57.57 0 0 0-.352.524v2.925a.566.566 0 0 0 .444.552.566.566 0 0 0-.444.553v2.924a.567.567 0 0 0 .567.567h15.866a.567.567 0 0 0 .567-.567V9.589a.566.566 0 0 0-.444-.553.566.566 0 0 0 .444-.552V5.559a.57.57 0 0 0-.352-.524.57.57 0 0 0 .352-.524"
    />
    <circle cx={3.215} cy={2.939} r={0.933} fill="#f2f2f2" />
    <circle cx={6.088} cy={2.939} r={0.933} fill="#f2f2f2" />
    <circle cx={3.215} cy={6.825} r={0.933} fill="#83b9f9" />
    <circle cx={6.088} cy={6.825} r={0.933} fill="#83b9f9" />
    <circle cx={3.215} cy={10.673} r={0.933} fill="#83b9f9" />
    <circle cx={6.088} cy={10.673} r={0.933} fill="#83b9f9" />
    <rect width={5.122} height={2.887} x={6.882} y={14.094} fill={`url(#b-${suffix})`} rx={1.443} />
  </svg>
)}
export default SvgBareMetalInfrastructure
