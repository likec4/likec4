// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgAzureSpringApps = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={-0.258} x2={8.727} y1={-0.226} y2={8.72} gradientUnits="userSpaceOnUse">
        <stop offset={0.059} stopColor="#0086ec" />
        <stop offset={1} stopColor="#004dae" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={9.064} x2={17.493} y1={8.78} y2={0.669} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#004dae" />
        <stop offset={0.941} stopColor="#0086ec" />
      </linearGradient>
      <linearGradient id={`c-${suffix}`} x1={8.863} x2={17.77} y1={8.499} y2={18.081} gradientUnits="userSpaceOnUse">
        <stop offset={0.059} stopColor="#0086ec" />
        <stop offset={1} stopColor="#004dae" />
      </linearGradient>
      <linearGradient id={`d-${suffix}`} x1={8.643} x2={0.493} y1={9.163} y2={17.672} gradientUnits="userSpaceOnUse">
        <stop offset={0.059} stopColor="#0086ec" />
        <stop offset={1} stopColor="#004dae" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M7.335 7.347H1.93a.286.286 0 0 1-.286-.286V1.942a.286.286 0 0 1 .286-.286h5.119a.286.286 0 0 1 .286.286zM8.48 8.491V.8a.287.287 0 0 0-.286-.289H.786A.287.287 0 0 0 .5.8v7.405a.286.286 0 0 0 .286.286Z"
    />
    <path
      fill={`url(#b-${suffix})`}
      d="M10.665 7.347v-5.4a.286.286 0 0 1 .286-.286h5.119a.286.286 0 0 1 .286.286v5.114a.286.286 0 0 1-.286.286zM9.52 8.491h7.694a.286.286 0 0 0 .286-.286V.8a.287.287 0 0 0-.286-.287H9.806A.287.287 0 0 0 9.52.8z"
    />
    <path
      fill={`url(#c-${suffix})`}
      d="M10.665 10.653h5.405a.286.286 0 0 1 .286.286v5.119a.286.286 0 0 1-.286.286h-5.119a.286.286 0 0 1-.286-.286v-5.4M9.52 9.509V17.2a.287.287 0 0 0 .286.287h7.408a.287.287 0 0 0 .286-.287V9.8a.286.286 0 0 0-.286-.286Z"
    />
    <path
      fill={`url(#d-${suffix})`}
      d="M7.335 10.653v5.4a.286.286 0 0 1-.286.286H1.93a.286.286 0 0 1-.286-.286v-5.114a.286.286 0 0 1 .286-.286zM8.48 9.509H.786A.286.286 0 0 0 .5 9.8v7.4a.287.287 0 0 0 .286.287h7.408a.287.287 0 0 0 .286-.287z"
    />
    <path
      fill="#5fb832"
      d="M14.9 8.22a16 16 0 0 0-1.033-4.881 5 5 0 0 1-.563.985 5.8 5.8 0 0 0-4.036-1.643A5.633 5.633 0 1 0 14.9 8.314Z"
    />
    <path
      fill="#fff"
      d="M13.821 10.849c-1.408 1.83-4.365 1.22-6.242 1.314a5 5 0 0 0-.658.047l.282-.094a22 22 0 0 0 2.769-.986 6.39 6.39 0 0 0 3.333-4.271 6.62 6.62 0 0 1-3.943 3.755 22.6 22.6 0 0 1-3.1.8l-.094-.047C4.809 10.708 4.762 7.751 7.2 6.812c1.08-.422 2.112-.188 3.286-.469A5.26 5.26 0 0 0 13.775 3.9c.704 2.02 1.455 5.071.046 6.949m-7.932 1.83a.469.469 0 1 0-.47-.469.47.47 0 0 0 .47.469"
    />
  </svg>
)}
export default SvgAzureSpringApps
