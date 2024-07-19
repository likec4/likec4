/**
 * @component
 * @param {React.SVGProps<SVGSVGElement>} props - The component props.
 * @returns {React.JSX.Element} - The rendered SVG component.
 */
const SvgDocumentAi = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <g fill="none" fillRule="evenodd">
      <g fill="#4285f4" transform="translate(5 3)">
        <path
          fillRule="nonzero"
          d="M7 0v2H2.022v14H7v2H1.654c-.866 0-1.576-.727-1.648-1.645L0 16.2V1.8C0 .81.748 0 1.663 0z"
        />
        <path fillRule="nonzero" d="M4 12.5h3V14H4zM4 9.5h3V11H4zM4 6.5h3V8H4z" />
        <circle cx={11.5} cy={16.5} r={1.5} transform="matrix(1 0 0 -1 0 33)" />
        <circle cx={13.5} cy={7.5} r={1.5} transform="matrix(1 0 0 -1 0 15)" />
        <circle cx={10.5} cy={2.5} r={1.5} />
      </g>
      <path
        stroke="#4285f4"
        d="M13 10.5h.814c1.916 0 1.676-.703 1.676-4M13 13.494h.813c3.777 0 4.733.221 4.685-1.994M13 16.508h.517c2.78-.006 3.011-.221 2.98 1.992"
      />
    </g>
  </svg>
)
export default SvgDocumentAi
