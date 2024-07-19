/**
 * @component
 * @param {React.SVGProps<SVGSVGElement>} props - The component props.
 * @returns {React.JSX.Element} - The rendered SVG component.
 */
const SvgTrace = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <defs>
      <style>{'.cls-2{fill:#4285f4}.cls-3{fill:#669df6}'}</style>
    </defs>
    <g data-name="Product Icons">
      <g data-name="colored-32/traces">
        <path d="M0 0h24v24H0z" fill="none" />
        <path id="Fill-1" d="M12 14h10v-4H12z" className="cls-2" />
        <g data-name="Shape">
          <path id="Fill-1-2" d="M12 22h10v-4H12z" className="cls-2" data-name="Fill-1" />
        </g>
        <g data-name="Shape">
          <path id="Fill-1-3" d="M8 22h4v-4H8z" className="cls-3" data-name="Fill-1" />
        </g>
      </g>
      <path d="M2 2h6v4H2zM2 10h10v4H2z" className="cls-3" />
    </g>
  </svg>
)
export default SvgTrace
