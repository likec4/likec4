// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgAzureHpcWorkbenches = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={9} x2={9} y1={1.498} y2={17.709} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#6bb9f2" />
        <stop offset={1} stopColor="#1b93eb" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={9} x2={9} y1={13.77} y2={2.92} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#e6e6e6" />
        <stop offset={1} stopColor="#fff" />
      </linearGradient>
      <linearGradient id={`c-${suffix}`} x1={8.312} x2={8.312} y1={7.64} y2={11.257} gradientUnits="userSpaceOnUse">
        <stop offset={0.225} stopColor="#32d4f5" />
        <stop offset={0.473} stopColor="#31d1f3" />
        <stop offset={0.633} stopColor="#2ec9eb" />
        <stop offset={0.999} stopColor="#198ab3" />
        <stop offset={1} stopColor="#198ab3" />
      </linearGradient>
      <linearGradient id={`d-${suffix}`} x1={8.22} x2={8.485} y1={5.701} y2={8.985} gradientUnits="userSpaceOnUse">
        <stop offset={0.225} stopColor="#32d4f5" />
        <stop offset={0.473} stopColor="#31d1f3" />
        <stop offset={0.633} stopColor="#2ec9eb" />
        <stop offset={0.999} stopColor="#198ab3" />
        <stop offset={1} stopColor="#198ab3" />
      </linearGradient>
    </defs>
    <path
      fill="#1b93eb"
      d="M16.232 8.416c0 4.752-5.745 8.578-6.994 9.354a.45.45 0 0 1-.476 0c-1.249-.776-6.994-4.6-6.994-9.354V2.7a.454.454 0 0 1 .444-.453C6.68 2.123 5.651.162 9 .162s2.32 1.961 6.788 2.082a.454.454 0 0 1 .444.453Z"
    />
    <path
      fill={`url(#a-${suffix})`}
      d="M15.632 8.464c0 4.359-5.268 7.867-6.414 8.579a.41.41 0 0 1-.436 0c-1.146-.712-6.414-4.22-6.414-8.579V3.22a.417.417 0 0 1 .407-.42C6.872 2.693 5.929.9 9 .9s2.128 1.8 6.225 1.909a.417.417 0 0 1 .407.416Z"
    />
    <path
      fill={`url(#b-${suffix})`}
      d="m10.981 4.741-.729-.3a.22.22 0 0 1-.126-.131l-.448-1.241a.225.225 0 0 0-.211-.149h-.94a.225.225 0 0 0-.216.163L7.96 4.3a.22.22 0 0 1-.132.146l-.646.254A.22.22 0 0 1 7 4.7l-1.237-.59a.23.23 0 0 0-.255.044l-.664.658a.225.225 0 0 0-.046.255l.595 1.273a.23.23 0 0 1 .007.16l-.223.7a.23.23 0 0 1-.146.146l-1.232.4a.22.22 0 0 0-.157.214v.97a.23.23 0 0 0 .163.216l1.21.35a.23.23 0 0 1 .148.136l.231.61a.22.22 0 0 1-.007.174l-.555 1.2a.23.23 0 0 0 .043.252l.669.682a.23.23 0 0 0 .261.044l.032-.016L6.963 12a.22.22 0 0 1 .187-.008l.65.263a.22.22 0 0 1 .128.132l.447 1.238a.225.225 0 0 0 .212.148h.886a.224.224 0 0 0 .216-.162l.351-1.214a.23.23 0 0 1 .132-.146l.647-.261a.22.22 0 0 1 .179.005l1.178.551a.22.22 0 0 0 .255-.044l.625-.625a.23.23 0 0 0 .037-.269l-.012-.025-.481-1.19a.23.23 0 0 1 0-.169l.268-.662A.23.23 0 0 1 13 9.435l1.206-.446a.23.23 0 0 0 .147-.211v-.886a.23.23 0 0 0-.165-.217l-1.2-.333a.22.22 0 0 1-.153-.145l-.235-.712a.22.22 0 0 1 .01-.166l.556-1.2a.22.22 0 0 0-.045-.254l-.608-.608A.28.28 0 0 0 12.2 4.2Z"
    />
    <path
      fill="#198ab3"
      d="M12.011 9.818A1.565 1.565 0 0 0 11 8.4a.817.817 0 1 0-.9-.007 1.45 1.45 0 0 0-1 1.425.26.26 0 0 0 .232.286h2.426a.26.26 0 0 0 .26-.259z"
    />
    <path
      fill={`url(#c-${suffix})`}
      d="M10.1 10.6a.387.387 0 0 0 .388-.386v-.046a2.21 2.21 0 0 0-2.173-2.21c-1.348 0-2.044.84-2.179 2.213a.39.39 0 0 0 .347.427h.039Z"
    />
    <path fill="#fff" d="M8.336 8.251a1.2 1.2 0 0 1-.661-.2l.654 1.711.651-1.7a1.2 1.2 0 0 1-.644.189" opacity={0.8} />
    <circle cx={8.327} cy={7.029} r={1.222} fill={`url(#d-${suffix})`} />
  </svg>
)}
export default SvgAzureHpcWorkbenches
