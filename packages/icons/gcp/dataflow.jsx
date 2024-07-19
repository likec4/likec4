/**
 * @component
 * @param {React.SVGProps<SVGSVGElement>} props - The component props.
 * @returns {React.JSX.Element} - The rendered SVG component.
 */
const SvgDataflow = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <defs>
      <style>
        {'.cls-1{fill:#669df6}.cls-1,.cls-2,.cls-3{fill-rule:evenodd}.cls-2,.cls-4{fill:#aecbfa}.cls-3{fill:#4285f4}'}
      </style>
    </defs>
    <g data-name="Product Icons">
      <path
        d="m13.79 5.04-.27-.94-1.41-.07-1.72.96 1.52 1.5-.02 1.73 1.02.01.02-1.73 4.24 2.56-.01 1.07 1.77.03V8.11z"
        className="cls-1"
      />
      <path
        d="M12.11 4.03h-.01l-1.42.35-.29.61-5.26 2.93-.03 2.05 1.78.03.02-1.07 4.31-2.45-.02 1.73.86.01z"
        className="cls-2"
      />
      <path
        d="M12.11 4.03h-.01L8.69 2l-1.74.95 3.44 2.04zM17.09 15.06l-4.3 2.45.02-1.72-1.72-.02-.02 1.72.82 2.48 1.42-.12.29-.85 5.27-2.93.03-2.09-1.79-.02z"
        className="cls-1"
      />
      <path d="m11.89 19.97-3.46 1.94h-.05l-1.66-.99 3.49-1.96z" className="cls-1" />
      <path
        d="m13.79 5.04 3.49-1.96-1.66-.99h-.05l-3.46 1.94zM13.61 19.01l3.44 2.04-1.69.95h-.05l-3.42-2.03z"
        className="cls-3"
      />
      <path d="m11.89 19.96-1.68-1-5.14-3.07v-2h1.76l-.01 1.04 4.25 2.56.02-1.72.86.01z" className="cls-2" />
      <circle id="Oval" cx={18.12} cy={12.04} r={1.14} className="cls-4" />
      <circle cx={5.88} cy={11.88} r={1.14} className="cls-4" />
      <circle cx={12.06} cy={9.99} r={1.14} className="cls-4" />
      <circle cx={11.97} cy={14} r={1.14} className="cls-4" />
    </g>
  </svg>
)
export default SvgDataflow
