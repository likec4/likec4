// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgDeviceSecurityApple = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={11.122} x2={2.751} y1={13.92} y2={-0.562} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#a33a85" />
        <stop offset={0.998} stopColor="#dc92bf" />
      </linearGradient>
    </defs>
    <path
      fill="#ce74b6"
      d="M12.494 7.023c0 4.037-4.969 7.286-6.049 7.945a.4.4 0 0 1-.412 0C4.952 14.309-.016 11.06-.016 7.023V2.167a.39.39 0 0 1 .384-.385C4.232 1.679 3.343.013 6.239.013s2.006 1.666 5.871 1.769a.39.39 0 0 1 .384.385Z"
    />
    <path
      fill={`url(#a-${suffix})`}
      d="M11.975 7.065c0 3.7-4.556 6.681-5.547 7.285a.36.36 0 0 1-.378 0C5.059 13.746.5 10.766.5 7.065V2.611a.357.357 0 0 1 .352-.353C4.4 2.164 3.583.636 6.239.636s1.84 1.528 5.384 1.622a.357.357 0 0 1 .352.353Z"
    />
    <path
      fill="#dc92bf"
      d="M6.05 8.645h11.418a.37.37 0 0 1 .388.346v8.676a.37.37 0 0 1-.388.346H6.05a.37.37 0 0 1-.388-.346V8.991a.37.37 0 0 1 .388-.346"
    />
    <path
      fill="#fff"
      d="M6.028 8.645h11.463a.347.347 0 0 1 .365.326v1.308H5.662V8.971a.35.35 0 0 1 .366-.326M16.2 13.686H8.669c-.167 0-.3.076-.3.17v.42c0 .094.136.17.3.17H16.2c.168 0 .3-.076.3-.17v-.42c0-.094-.137-.17-.3-.17M16.2 11.773H8.669c-.167 0-.3.076-.3.17v.42c0 .094.136.17.3.17H16.2c.168 0 .3-.076.3-.17v-.42c0-.094-.137-.17-.3-.17M16.68 16.286H8.652c-.178 0-.323.081-.323.181v.448c0 .1.145.182.323.182h8.028c.179 0 .324-.081.324-.182v-.448c-.004-.1-.145-.181-.324-.181"
      opacity={0.7}
    />
    <circle cx={7.118} cy={12.153} r={0.498} fill="#fff" opacity={0.7} />
    <circle cx={7.118} cy={14.066} r={0.498} fill="#fff" opacity={0.7} />
    <circle cx={6.998} cy={16.691} r={0.531} fill="#fff" opacity={0.7} />
  </svg>
)}
export default SvgDeviceSecurityApple
