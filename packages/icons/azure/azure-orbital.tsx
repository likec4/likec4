// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgAzureOrbital = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient
        id={`a-${suffix}`}
        x1={-485.564}
        x2={-485.564}
        y1={-607.983}
        y2={-600.613}
        gradientTransform="matrix(1.147 0 0 .716 567.077 439.786)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0.302} stopColor="#0078d4" />
        <stop offset={1} stopColor="#005ba1" />
      </linearGradient>
      <linearGradient
        id={`b-${suffix}`}
        x1={-465.421}
        x2={-465.421}
        y1={-302.323}
        y2={-299.441}
        gradientTransform="rotate(45 -610.388 423.406)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#9cebff" />
        <stop offset={1} stopColor="#50e6ff" />
      </linearGradient>
      <linearGradient
        id={`c-${suffix}`}
        x1={-465.421}
        x2={-465.421}
        y1={-307.134}
        y2={-302.876}
        gradientTransform="rotate(45 -610.388 423.406)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#5ea0ef" />
        <stop offset={1} stopColor="#0078d4" />
      </linearGradient>
    </defs>
    <path
      fill="#e6e6e6"
      d="M9.192 17.636a.445.445 0 0 1 0-.889 7.9 7.9 0 0 0 5.472-13.523A7.9 7.9 0 0 0 1.233 8.918a.445.445 0 1 1-.889.007A8.784 8.784 0 0 1 15.287 2.59 8.784 8.784 0 0 1 9.2 17.636Z"
    />
    <path
      fill="#b3b3b3"
      d="M4.212 17.93a4.246 4.246 0 0 1-4.081-3.614 4 4 0 0 1-.041-.628c.007-.281.143-.45.363-.454s.4.163.4.451a3.26 3.26 0 0 0 .281 1.43A3.38 3.38 0 0 0 3.9 17.164c.161.021.325.03.487.038.261.012.4.13.4.356s-.14.358-.389.372c-.062.003-.124 0-.186 0"
      opacity={0.51}
    />
    <path
      fill="#b3b3b3"
      d="M4.248 16.533A2.81 2.81 0 0 1 1.5 13.658a1 1 0 0 1 .043-.275.33.33 0 0 1 .335-.24.335.335 0 0 1 .346.224.9.9 0 0 1 .038.369A2.05 2.05 0 0 0 4.3 15.765a2 2 0 0 1 .233.006.39.39 0 0 1 .345.425.35.35 0 0 1-.373.336c-.085.004-.171.001-.257.001"
      opacity={0.51}
    />
    <rect
      width={14.353}
      height={3.541}
      x={2.842}
      y={6.296}
      fill={`url(#a-${suffix})`}
      rx={0.49}
      transform="rotate(45 10.018 8.066)"
    />
    <path fill="#005ba1" d="m5.875 11.519.638.638-1.335 1.334-.638-.638z" />
    <circle cx={4.202} cy={13.83} r={1.134} fill={`url(#b-${suffix})`} />
    <path
      fill="#005ba1"
      d="m7.085 7.635 3.313 3.313-.656.656-3.314-3.313zM12.102 4.187l1.743 1.743a.23.23 0 0 1 0 .324L12.84 7.26l-2.067-2.067 1.005-1.006a.23.23 0 0 1 .324 0"
    />
    <path
      fill="#50e6ff"
      d="m10.554 4.973 2.505 2.505a.576.576 0 0 1 0 .815l-2.663 2.663-3.323-3.323L9.736 4.97a.576.576 0 0 1 .818.003"
    />
    <path
      fill={`url(#c-${suffix})`}
      d="m7.725 14.275-3.972-3.96a.786.786 0 0 1 .331-1.3l2.4-.767 3.324 3.324-.788 2.377a.787.787 0 0 1-1.295.326"
    />
  </svg>
)}
export default SvgAzureOrbital
