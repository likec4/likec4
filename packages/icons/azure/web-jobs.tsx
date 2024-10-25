// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgWebJobs = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`b-${suffix}`} x1={3.844} x2={3.817} y1={9.561} y2={6.165} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#ccc" />
        <stop offset={0.123} stopColor="#d7d7d7" />
        <stop offset={1} stopColor="#fcfcfc" />
      </linearGradient>
      <linearGradient id={`c-${suffix}`} x1={8.763} x2={8.763} y1={12.958} y2={9.913} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#ccc" />
        <stop offset={0.123} stopColor="#d7d7d7" />
        <stop offset={1} stopColor="#fcfcfc" />
      </linearGradient>
      <linearGradient
        id={`d-${suffix}`}
        x1={-105.292}
        x2={-105.292}
        y1={373.011}
        y2={364.165}
        gradientTransform="rotate(-18.3 -1154.522 -177.398)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#32bedd" />
        <stop offset={0.576} stopColor="#32ceef" />
        <stop offset={1} stopColor="#32d4f5" />
      </linearGradient>
      <radialGradient
        id={`a-${suffix}`}
        cx={4649.515}
        cy={3578.357}
        r={48.597}
        gradientTransform="matrix(.15 0 0 .15 -689.641 -529.326)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0.183} stopColor="#5ea0ef" />
        <stop offset={1} stopColor="#0078d4" />
      </radialGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M12.257 13.19A7.289 7.289 0 1 1 3.323 1.67l.077-.056a7.289 7.289 0 0 1 8.857 11.576"
      data-name="Path 1237"
    />
    <path
      fill="#fff"
      d="M5.808 5.913a11.16 11.16 0 0 1 7.642-3.071A7.2 7.2 0 0 0 12.176 1.6a12.4 12.4 0 0 0-4.026.95 10.6 10.6 0 0 0-3.5 2.414 2.35 2.35 0 0 1 1.158.949M2.2 8.841a16 16 0 0 0-.717 2.25 8 8 0 0 0 .534.791 7 7 0 0 0 .475.555 15.3 15.3 0 0 1 .928-2.975 2.33 2.33 0 0 1-1.22-.621"
      opacity={0.6}
    />
    <path
      fill="#f2f2f2"
      d="M3.039 4.952a10.2 10.2 0 0 1-.591-2.526 7.3 7.3 0 0 0-.948 1.25A11.4 11.4 0 0 0 1.991 5.7a2.33 2.33 0 0 1 1.048-.748"
      opacity={0.55}
    />
    <circle cx={3.825} cy={7.157} r={2.343} fill={`url(#b-${suffix})`} />
    <g fill="#f2f2f2">
      <path
        d="M7.241 11.435a1.52 1.52 0 0 1 .459-1.088 10.3 10.3 0 0 1-2.165-1.592 2.34 2.34 0 0 1-1.28.7 10 10 0 0 0 1.245 1.1 10.6 10.6 0 0 0 1.755 1.07 1.4 1.4 0 0 1-.014-.19M12.642 11.617a10.3 10.3 0 0 1-2.362-.275c0 .031.005.062.005.093a1.52 1.52 0 0 1-.433 1.065 12 12 0 0 0 2.925.209 7.2 7.2 0 0 0 .987-1.152 11 11 0 0 1-1.122.06"
        opacity={0.55}
      />
    </g>
    <circle cx={8.763} cy={11.435} r={1.522} fill={`url(#c-${suffix})`} />
    <path
      fill="#f2f2f2"
      d="M10.635 7.368a1.6 1.6 0 0 1 .525-.848 21.7 21.7 0 0 1-3.827-3.558A14.6 14.6 0 0 1 5.632.457 7 7 0 0 0 4.7.816a15.2 15.2 0 0 0 1.829 2.732 22.6 22.6 0 0 0 4.106 3.82"
      opacity={0.7}
    />
    <circle cx={12.232} cy={7.66} r={1.617} fill="#f2f2f2" />
    <path
      fill="#f2f2f2"
      d="M14.948 8.75c-.1-.05-.18-.094-.275-.145l-.026-.014q-.129-.068-.254-.137l-.047-.026-.229-.128-.056-.032q-.136-.075-.27-.154a1.54 1.54 0 0 1-.546.793q.158.093.321.184l.072.041.3.165.029.016q.361.197.739.391a7 7 0 0 0 .243-.955Z"
      opacity={0.55}
    />
    <circle cx={3.825} cy={7.157} r={2.343} fill={`url(#b-${suffix})`} />
    <circle cx={8.763} cy={11.435} r={1.522} fill="#f2f2f2" />
    <path
      fill={`url(#d-${suffix})`}
      d="m17.5 10.571-.317-.958h-1.287l-.485-.566.154-1.281-.895-.45-.112.112-.8.8-.744-.052-.8-1.02-.958.317-.006.151V8.76l-.566.485-1.26-.157-.449.894.112.112.8.8-.051.743-1.037.81.317.957.151.006h1.136l.485.566-.154 1.281.895.449.112-.112.8-.8.744.052.8 1.02.958-.317.006-.151v-1.135l.566-.486 1.281.154.45-.894-.112-.113-.8-.8.052-.744Zm-3.739 2.779a1.941 1.941 0 1 1 1.233-2.45 1.94 1.94 0 0 1-1.233 2.45"
    />
    <path
      fill="#50e6ff"
      d="M7.613 14.753v-.794l-.113-.041-.85-.279-.221-.539.432-.919-.561-.562-.112.056-.794.4-.543-.223-.344-.952h-.794l-.042.111-.278.85-.544.223-.905-.432-.557.557.055.112.4.794-.222.543L.649 14v.8l.111.042.85.279.223.543-.432.919.557.557.111-.056.794-.4.543.222.349.962h.794l.041-.112.279-.85.543-.222.92.431.557-.557-.056-.111-.4-.794.223-.543Zm-3.482 1.153a1.529 1.529 0 1 1 1.528-1.529 1.53 1.53 0 0 1-1.528 1.529"
    />
    <circle cx={13.151} cy={11.507} r={1.941} fill="#fff" />
    <circle cx={4.131} cy={14.377} r={1.528} fill="#fff" />
  </svg>
)}
export default SvgWebJobs
