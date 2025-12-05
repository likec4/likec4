// @ts-nocheck

import type { SVGProps } from 'react'
const SvgPushbullet = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    preserveAspectRatio="xMidYMid"
    viewBox="0 0 256 256"
    {...props}
  >
    <defs>
      <linearGradient id="pushbullet_svg__c" x1="8.59%" x2="77.471%" y1="1.954%" y2="73.896%">
        <stop offset="0%" stopColor="#4CB36B" />
        <stop offset="100%" stopColor="#3EA16F" />
      </linearGradient>
      <path
        id="pushbullet_svg__a"
        d="M256 128c0 70.692-57.308 128-128 128S0 198.692 0 128 57.308 0 128 0s128 57.308 128 128"
      />
    </defs>
    <mask id="pushbullet_svg__b" fill="#fff">
      <use xlinkHref="#pushbullet_svg__a" />
    </mask>
    <use xlinkHref="#pushbullet_svg__a" fill="#67BF79" />
    <path
      fill="#67BF79"
      d="M256 128c0 70.692-57.308 128-128 128S0 198.692 0 128 57.308 0 128 0s128 57.308 128 128"
      mask="url(#pushbullet_svg__b)"
    />
    <path
      fill="url(#pushbullet_svg__c)"
      d="M63.111 187.022 96.178 72l64.533 60.978L200 90.133l87.533 86.289-110.844 124.889z"
      mask="url(#pushbullet_svg__b)"
    />
    <path
      fill="#FFF"
      d="M77 189.6c-16.733 0-16.733 0-16.733-16.733V81c0-16.733 0-16.733 16.733-16.733h3.334c16.733 0 16.733 0 16.733 16.733v91.867c0 16.733 0 16.733-16.733 16.733zM121.041 189.6c-5.699 0-8.508-2.809-8.508-8.508V72.774c0-5.698 2.809-8.507 8.508-8.507h37.537c32.178 0 52.628 32.273 52.628 63.025S190.578 189.6 158.578 189.6z"
      mask="url(#pushbullet_svg__b)"
    />
  </svg>
)
export default SvgPushbullet
