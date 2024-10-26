// @ts-nocheck

import type { SVGProps } from 'react'
const SvgControls = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id="Controls_svg__a" x1={3.524} x2={3.524} y1={6.162} y2={18} gradientUnits="userSpaceOnUse">
        <stop offset={0.17} stopColor="#50e6ff" />
        <stop offset={0.635} stopColor="#3dcdea" />
        <stop offset={1} stopColor="#32bedd" />
      </linearGradient>
      <linearGradient id="Controls_svg__b" x1={8.941} x2={8.941} y1={14.256} gradientUnits="userSpaceOnUse">
        <stop offset={0.17} stopColor="#50e6ff" />
        <stop offset={0.635} stopColor="#3dcdea" />
        <stop offset={1} stopColor="#32bedd" />
      </linearGradient>
      <linearGradient id="Controls_svg__c" x1={14.444} x2={14.444} y1={6.162} gradientUnits="userSpaceOnUse">
        <stop offset={0.17} stopColor="#50e6ff" />
        <stop offset={0.635} stopColor="#3dcdea" />
        <stop offset={1} stopColor="#32bedd" />
      </linearGradient>
    </defs>
    <rect width={2.494} height={18} x={2.276} fill="#0078d4" rx={0.596} />
    <rect width={2.494} height={18} x={7.693} fill="#0078d4" rx={0.596} />
    <rect width={2.494} height={18} x={13.197} fill="#0078d4" rx={0.596} />
    <rect width={2.494} height={11.838} x={2.276} y={6.162} fill="url(#Controls_svg__a)" rx={0.596} />
    <rect width={2.494} height={3.744} x={7.693} y={14.256} fill="url(#Controls_svg__b)" rx={0.596} />
    <rect width={2.494} height={11.838} x={13.197} y={6.162} fill="url(#Controls_svg__c)" rx={0.596} />
    <rect width={3.766} height={1.178} x={1.673} y={6.034} fill="#e6e6e6" rx={0.589} />
    <rect width={3.766} height={1.178} x={7.109} y={13.965} fill="#e6e6e6" rx={0.589} />
    <rect width={3.766} height={1.178} x={12.561} y={6.034} fill="#e6e6e6" rx={0.589} />
  </svg>
)
export default SvgControls
