// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgPrivateLinkService = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient
        id={`a-${suffix}`}
        x1={7.699}
        x2={7.699}
        y1={956.076}
        y2={960.567}
        gradientTransform="translate(0 -950)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0.23} stopColor="#5ea0ef" />
        <stop offset={0.93} stopColor="#127fd9" />
      </linearGradient>
      <linearGradient
        id={`b-${suffix}`}
        x1={9.927}
        x2={9.927}
        y1={957.947}
        y2={962.438}
        gradientTransform="translate(0 -950)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0.02} stopColor="#5ea0ef" />
        <stop offset={0.93} stopColor="#127fd9" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M8.588 6.076h-1.8a2.246 2.246 0 0 0-.348 4.461 2.4 2.4 0 0 1 .026-.837 1.418 1.418 0 0 1 .326-2.8h1.8a1.422 1.422 0 0 1 0 2.844h-.498a1.1 1.1 0 0 0-.1.449 1 1 0 0 0 .071.374h.527a2.246 2.246 0 1 0 0-4.491Z"
    />
    <path
      fill={`url(#b-${suffix})`}
      d="M11.182 7.977a3 3 0 0 1 .026.345 2.3 2.3 0 0 1-.049.49 1.418 1.418 0 0 1-.325 2.8h-1.8a1.422 1.422 0 0 1 0-2.844h.494a1.05 1.05 0 0 0 .1-.449 1 1 0 0 0-.071-.375h-.52a2.246 2.246 0 0 0 0 4.491h1.8a2.246 2.246 0 0 0 .348-4.461Z"
    />
    <path
      fill="#50e6ff"
      d="m5.58 13.381-.412.416a.28.28 0 0 1-.4 0L.164 9.2a.566.566 0 0 1 0-.8l.416-.408 5 4.993a.276.276 0 0 1 0 .391Z"
    />
    <path
      fill="#1490df"
      d="m5.082 3.876.46.46a.28.28 0 0 1 0 .4L.625 9.665l-.461-.456a.566.566 0 0 1 0-.8l4.521-4.533a.28.28 0 0 1 .397 0"
    />
    <path
      fill="#50e6ff"
      d="M12.417 13.707a.276.276 0 0 1-.006-.391h.006l5-4.988.416.415a.566.566 0 0 1 0 .8l-4.611 4.588a.276.276 0 0 1-.391.006l-.006-.005Z"
    />
    <path
      fill="#1490df"
      d="m13.311 4.205 4.525 4.536a.563.563 0 0 1 0 .793l-.461.46-4.921-4.932a.287.287 0 0 1 0-.4l.46-.457a.28.28 0 0 1 .397 0"
    />
  </svg>
)}
export default SvgPrivateLinkService
