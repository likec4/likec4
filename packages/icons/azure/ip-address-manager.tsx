// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgIpAddressManager = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={7.824} x2={7.824} y1={13.644} y2={4.395} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#32bedd" />
        <stop offset={0.18} stopColor="#32caea" />
        <stop offset={0.41} stopColor="#32d2f2" />
        <stop offset={0.78} stopColor="#32d4f5" />
      </linearGradient>
      <linearGradient
        id={`b-${suffix}`}
        x1={-272.759}
        x2={-272.759}
        y1={860.23}
        y2={852.711}
        gradientTransform="matrix(1 0 0 -1 287 869.516)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#5ea0ef" />
        <stop offset={1} stopColor="#0078d4" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M10.031 12.739v-.328l.312-.1.832-.267.082-.257-.282-.749-.047-.084-.165-.297.24-.24.602-.602.225-.225.287.136.796.379.212-.086.213-.648v-.503h1.655l.107.297.308.854.202.083.035-.018V4.395H0v8.724c0 .29.235.524.524.524h9.507z"
    />
    <path
      fill="#0078d4"
      d="M.526 1.063h14.597c.29 0 .525.234.526.523v2.8089999999999997H.001V1.578a.523.523 0 0 1 .524-.515ZM11.746 6.741a1.215 1.215 0 1 1-1.215 1.215c0-.671.544-1.215 1.215-1.215M6.662 7.956a1.215 1.215 0 1 0 0-.002zm-3.974 0a1.215 1.215 0 1 0 1.215-1.215h-.001c-.67 0-1.214.543-1.214 1.214z"
    />
    <path
      fill={`url(#b-${suffix})`}
      d="M18 13.541v-.852h-.113l-.927-.288-.213-.639.464-1.002-.602-.602h-.113l-.864.439-.577-.238-.376-1.04h-.889v.125l-.301.915-.589.238-.975-.464-.602.602.063.113.348.927-.201.627-1.052.338v.915h.125l.914.301.213.563-.464 1.003.627.639.125-.063.852-.438.589.238.377 1.04h.852v-.125l.301-.914.589-.238.99.463.602-.601-.063-.113-.364-.905.238-.588 1.015-.373Zm-3.734 1.254h-.026a1.642 1.642 0 1 1 .025 0Z"
    />
  </svg>
)}
export default SvgIpAddressManager
