// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgDefenderMeter = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18" {...props}>
    <path
      fill={`url(#a-${suffix})`}
      d="m5.312 5.373-.389-.595a6.4 6.4 0 0 1 1.375-.672l.424.804.59-.311-.363-.689a8.3 8.3 0 0 1 1.718-.237v.771h.666v-.771A8.3 8.3 0 0 1 11 3.897l-.319.684.605.282.361-.776a6.4 6.4 0 0 1 1.49.731l-.429.527.517.421.442-.542c.277.242.473.472.59.654l.005.006-.43.585.537.395.703-.957-.255-.393c-.2-.307-.534-.671-.994-1.024a7 7 0 0 0-2.258-1.13A9 9 0 0 0 9 3c-2.158 0-3.734.686-4.731 1.42-.509.375-.873.767-1.086 1.094l-.255.393.703.957.538-.395-.43-.585.003-.006c.126-.194.34-.442.645-.702l.367.562z"
    />
    <path
      fill={`url(#b-${suffix})`}
      fillRule="evenodd"
      d="M2 2h14v8.667H9.508l-2.9-4.19-.549.38 2.638 3.81H2z"
      clipRule="evenodd"
    />
    <path
      fill={`url(#c-${suffix})`}
      fillRule="evenodd"
      d="M2 0a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z"
      clipRule="evenodd"
    />
    <path
      fill={`url(#d-${suffix})`}
      d="m5.312 5.373-.389-.595a6.4 6.4 0 0 1 1.375-.672l.424.804.59-.311-.363-.689a8.3 8.3 0 0 1 1.718-.237v.771h.666v-.771A8.3 8.3 0 0 1 11 3.897l-.319.684.605.282.361-.776a6.4 6.4 0 0 1 1.49.731l-.429.527.517.421.442-.542c.277.242.473.472.59.654l.005.006-.43.585.537.395.703-.957-.255-.393c-.2-.307-.534-.671-.994-1.024a7 7 0 0 0-2.258-1.13A9 9 0 0 0 9 3c-2.158 0-3.734.686-4.731 1.42-.509.375-.873.767-1.086 1.094l-.255.393.703.957.538-.395-.43-.585.003-.006c.126-.194.34-.442.645-.702l.367.562z"
    />
    <path fill={`url(#e-${suffix})`} fillRule="evenodd" d="M1.333 1.333h15.334v10H1.333z" clipRule="evenodd" />
    <path fill={`url(#f-${suffix})`} d="M1.667 16.333h1.666v-.666H1.667z" />
    <path fill={`url(#g-${suffix})`} d="M16.333 16.333h-1.666v-.666h1.666z" />
    <path
      fill={`url(#h-${suffix})`}
      fillRule="evenodd"
      d="m5.312 5.373-.389-.595a6.4 6.4 0 0 1 1.375-.672l.424.804.59-.311-.363-.689a8.3 8.3 0 0 1 1.718-.237v.771h.666v-.771A8.3 8.3 0 0 1 11 3.897l-.319.684.605.282.361-.776a6.4 6.4 0 0 1 1.49.731l-.429.527.517.421.442-.542c.277.242.473.472.59.654l.005.006-.43.585.537.395.703-.957-.255-.393c-.2-.307-.534-.671-.994-1.024a7 7 0 0 0-2.258-1.13A9 9 0 0 0 9 3c-2.158 0-3.734.686-4.731 1.42-.509.375-.873.767-1.086 1.094l-.255.393.703.957.538-.395-.43-.585.003-.006c.126-.194.34-.442.645-.702l.367.562z"
      clipRule="evenodd"
    />
    <path
      fill="#005BA1"
      d="m5.312 5.373-.389-.595a6.4 6.4 0 0 1 1.375-.672l.424.804.59-.311-.363-.689a8.3 8.3 0 0 1 1.718-.237v.771h.666v-.771A8.3 8.3 0 0 1 11 3.897l-.319.684.605.282.361-.776a6.4 6.4 0 0 1 1.49.731l-.429.527.517.421.442-.542c.277.242.473.472.59.654l.005.006-.43.585.537.395.703-.957-.255-.393c-.2-.307-.534-.671-.994-1.024a7 7 0 0 0-2.258-1.13A9 9 0 0 0 9 3c-2.158 0-3.734.686-4.731 1.42-.509.375-.873.767-1.086 1.094l-.255.393.703.957.538-.395-.43-.585.003-.006c.126-.194.34-.442.645-.702l.367.562zM1.667 16.333h1.666v-.666H1.667zM16.333 16.333h-1.666v-.666h1.666z"
    />
    <path fill="#005BA1" fillRule="evenodd" d="M16.667 1.333H1.333v10h15.334zM16 2H2v8.667h14z" clipRule="evenodd" />
    <path
      fill="#0078D4"
      d="M6.377 6.02a.56.56 0 0 0-.316.28.44.44 0 0 0 .006.388l2.39 4.635 1.09-.41-2.393-4.639a.55.55 0 0 0-.325-.264.7.7 0 0 0-.452.01"
    />
    <path fill="#767676" d="M10.882 11.842a1.602 1.602 0 1 0-3.201.122 1.602 1.602 0 0 0 3.201-.122" />
    <defs>
      <linearGradient id={`a-${suffix}`} x1={9} x2={9} y1={17.951} y2={0.049} gradientUnits="userSpaceOnUse">
        <stop offset={0.09} stopColor="#32BEDD" />
        <stop offset={1} stopColor="#50E6FF" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={9} x2={9} y1={17.951} y2={0.049} gradientUnits="userSpaceOnUse">
        <stop offset={0.09} stopColor="#32BEDD" />
        <stop offset={1} stopColor="#50E6FF" />
      </linearGradient>
      <linearGradient id={`c-${suffix}`} x1={9} x2={9} y1={17.951} y2={0.049} gradientUnits="userSpaceOnUse">
        <stop offset={0.09} stopColor="#32BEDD" />
        <stop offset={1} stopColor="#50E6FF" />
      </linearGradient>
      <linearGradient id={`d-${suffix}`} x1={9.083} x2={9.083} y1={0} y2={18.084} gradientUnits="userSpaceOnUse">
        <stop stopColor="#C3F1FF" />
        <stop offset={0.999} stopColor="#9CEBFF" />
      </linearGradient>
      <linearGradient id={`e-${suffix}`} x1={9.083} x2={9.083} y1={0} y2={18.084} gradientUnits="userSpaceOnUse">
        <stop stopColor="#C3F1FF" />
        <stop offset={0.999} stopColor="#9CEBFF" />
      </linearGradient>
      <linearGradient id={`f-${suffix}`} x1={9.083} x2={9.083} y1={0} y2={18.084} gradientUnits="userSpaceOnUse">
        <stop stopColor="#C3F1FF" />
        <stop offset={0.999} stopColor="#9CEBFF" />
      </linearGradient>
      <linearGradient id={`g-${suffix}`} x1={9.083} x2={9.083} y1={0} y2={18.084} gradientUnits="userSpaceOnUse">
        <stop stopColor="#C3F1FF" />
        <stop offset={0.999} stopColor="#9CEBFF" />
      </linearGradient>
      <linearGradient id={`h-${suffix}`} x1={9.083} x2={9.083} y1={0} y2={18.084} gradientUnits="userSpaceOnUse">
        <stop stopColor="#C3F1FF" />
        <stop offset={0.999} stopColor="#9CEBFF" />
      </linearGradient>
    </defs>
  </svg>
)}
export default SvgDefenderMeter
