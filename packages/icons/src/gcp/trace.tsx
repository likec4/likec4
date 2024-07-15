import type { SVGProps } from 'react'
const SvgTrace = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} {...props}>
    <defs>
      <style>{'.Trace_svg__cls-2{fill:#4285f4}.Trace_svg__cls-3{fill:#669df6}'}</style>
    </defs>
    <g data-name="Product Icons">
      <g data-name="colored-32/traces">
        <path
          d="M0 0h24v24H0z"
          style={{
            fill: 'none'
          }}
        />
        <path id="Trace_svg__Fill-1" d="M12 14h10v-4H12z" className="Trace_svg__cls-2" />
        <g data-name="Shape">
          <path id="Trace_svg__Fill-1-2" d="M12 22h10v-4H12z" className="Trace_svg__cls-2" data-name="Fill-1" />
        </g>
        <g data-name="Shape">
          <path id="Trace_svg__Fill-1-3" d="M8 22h4v-4H8z" className="Trace_svg__cls-3" data-name="Fill-1" />
        </g>
      </g>
      <path d="M2 2h6v4H2zM2 10h10v4H2z" className="Trace_svg__cls-3" />
    </g>
  </svg>
)
export default SvgTrace
