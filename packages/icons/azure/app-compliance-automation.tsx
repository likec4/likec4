// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgAppComplianceAutomation = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient
        id={`a-${suffix}`}
        x1={-235}
        x2={-235}
        y1={996.992}
        y2={979.11}
        gradientTransform="matrix(1 0 0 -1 244 997.516)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0.18} stopColor="#5ea0ef" />
        <stop offset={1} stopColor="#0078d4" />
      </linearGradient>
      <linearGradient
        id={`b-${suffix}`}
        x1={-234.949}
        x2={-234.949}
        y1={812.064}
        y2={803.315}
        gradientTransform="translate(244 -798)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#86d633" />
        <stop offset={0.596} stopColor="#a4e434" />
        <stop offset={0.999} stopColor="#b4ec36" />
      </linearGradient>
      <linearGradient id={`c-${suffix}`} x1={9.051} x2={9.051} y1={11.847} y2={7.673} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#5e9624" />
        <stop offset={0.111} stopColor="#64a026" />
        <stop offset={0.348} stopColor="#6eaf2a" />
        <stop offset={0.619} stopColor="#74b92c" />
        <stop offset={0.999} stopColor="#76bc2d" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M17.966 11.442a4.104 4.104 0 0 0-3.497-3.985 5.13 5.13 0 0 0-5.23-4.981 5.23 5.23 0 0 0-4.981 3.477 4.84 4.84 0 0 0-4.224 4.762 4.98 4.98 0 0 0 5.051 4.802h8.617q.11.015.219 0a4.115 4.115 0 0 0 4.045-4.075"
    />
    <path
      fill={`url(#b-${suffix})`}
      d="m10.457 6.85-.424-.26a.32.32 0 0 1-.133-.163l-.323-.902a.32.32 0 0 0-.299-.21h-.54a.32.32 0 0 0-.306.234l-.229.844a.32.32 0 0 1-.181.208l-.424.183a.32.32 0 0 1-.258-.003l-.85-.391a.32.32 0 0 0-.361.068l-.381.397a.32.32 0 0 0-.054.364l.417.814a.32.32 0 0 1 .013.26l-.164.418a.31.31 0 0 1-.202.187l-.911.281a.32.32 0 0 0-.224.303v.536c0 .143.096.268.233.306l.832.228a.32.32 0 0 1 .208.18l.183.425a.32.32 0 0 1-.002.256l-.38.842a.32.32 0 0 0 .067.357l.399.392a.32.32 0 0 0 .369.055l.798-.414a.32.32 0 0 1 .263-.014l.43.17a.32.32 0 0 1 .18.182l.335.876a.32.32 0 0 0 .296.204h.551a.32.32 0 0 0 .3-.214l.275-.802a.32.32 0 0 1 .142-.172l.397-.228a.32.32 0 0 1 .286-.015l.758.336a.32.32 0 0 0 .355-.068l.398-.406a.32.32 0 0 0 .06-.36l-.344-.717a.32.32 0 0 1-.005-.265l.182-.416a.32.32 0 0 1 .193-.175l.872-.281a.32.32 0 0 0 .22-.302v-.522a.32.32 0 0 0-.235-.306l-.863-.232a.32.32 0 0 1-.194-.15l-.211-.374a.32.32 0 0 1-.016-.281l.329-.771a.32.32 0 0 0-.072-.353l-.407-.392a.32.32 0 0 0-.354-.059l-.698.325a.32.32 0 0 1-.3-.017Zm-2.82 3.544a.31.31 0 0 1-.093-.211C7.496 8.376 9.175 7.88 10.062 8.72a1.45 1.45 0 0 1-2.018 2.081l-.406-.407Z"
    />
    <ellipse cx={9.051} cy={9.76} fill={`url(#c-${suffix})`} rx={2.078} ry={2.087} />
    <path
      fill="#fff"
      d="m10.066 8.829-1.439 1.446-.701-.701-.035-.029a.252.252 0 0 0-.321.384l.879.88.035.029a.25.25 0 0 0 .32-.03l1.62-1.624.029-.035a.252.252 0 0 0-.384-.32h-.004Z"
    />
  </svg>
)}
export default SvgAppComplianceAutomation
