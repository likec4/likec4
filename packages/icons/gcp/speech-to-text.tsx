// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgSpeechToText = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <defs>
      <style>{'.cls-1{fill:#4285f4}.cls-3{fill:#669df6}'}</style>
    </defs>
    <g data-name="Product Icons">
      <g data-name="colored-32/speech">
        <path d="M11 2h2v20h-2z" className="cls-1" />
        <path d="M0 0h24v24H0z" fill="none" />
        <path id={`Rectangle-path-2-${suffix}`} d="M7 8h2v8H7z" className="cls-1" data-name="Rectangle-path" />
        <path id={`Rectangle-path-3-${suffix}`} d="M15 8h2v8h-2z" className="cls-1" data-name="Rectangle-path" />
        <path id={`Rectangle-path-4-${suffix}`} d="M3 5h2v14H3z" className="cls-1" data-name="Rectangle-path" />
        <path id={`Rectangle-path-5-${suffix}`} d="M19 5h2v14h-2z" className="cls-1" data-name="Rectangle-path" />
        <path id={`Rectangle-path-6-${suffix}`} d="M11 2h2v10h-2z" className="cls-3" data-name="Rectangle-path" />
        <path id={`Rectangle-path-7-${suffix}`} d="M7 8h2v4H7z" className="cls-3" data-name="Rectangle-path" />
        <path id={`Rectangle-path-8-${suffix}`} d="M15 8h2v4h-2z" className="cls-3" data-name="Rectangle-path" />
        <path id={`Rectangle-path-9-${suffix}`} d="M3 5h2v7H3z" className="cls-3" data-name="Rectangle-path" />
        <path id={`Rectangle-path-10-${suffix}`} d="M19 5h2v7h-2z" className="cls-3" data-name="Rectangle-path" />
      </g>
    </g>
  </svg>
)}
export default SvgSpeechToText
